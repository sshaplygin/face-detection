/**
 * Post-build script for electron-builder.
 * Fixes OpenCV dylib references in the .node binary so it can find
 * libraries at runtime (both dev and packaged builds).
 */
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const glob = require('glob')

exports.default = async function afterPack(context) {
  const appDir = context.appOutDir
  const resourcesDir = path.join(appDir, `${context.packager.appInfo.productFilename}.app`, 'Contents', 'Resources')

  // Find all .node files in the unpacked asar
  const nodeFiles = glob.sync('**/*.node', { cwd: resourcesDir, absolute: true })

  for (const nodeFile of nodeFiles) {
    console.log(`[fix-dylib] Processing: ${nodeFile}`)

    // Get linked dylibs
    const otoolOutput = execSync(`otool -L "${nodeFile}"`).toString()
    const lines = otoolOutput.split('\n').slice(1) // skip first line (file path)

    for (const line of lines) {
      const match = line.trim().match(/^(.+\.dylib)/)
      if (!match) continue

      const dylibPath = match[1]

      // Only fix Homebrew OpenCV paths
      if (!dylibPath.includes('opencv') && !dylibPath.includes('/opt/homebrew')) continue

      const dylibName = path.basename(dylibPath)
      const targetDir = path.dirname(nodeFile)
      const targetPath = path.join(targetDir, dylibName)

      // Copy the dylib next to the .node file
      if (fs.existsSync(dylibPath) && !fs.existsSync(targetPath)) {
        fs.copyFileSync(dylibPath, targetPath)
        console.log(`[fix-dylib] Copied: ${dylibName}`)
      }

      // Rewrite the reference to use @loader_path
      const newPath = `@loader_path/${dylibName}`
      execSync(`install_name_tool -change "${dylibPath}" "${newPath}" "${nodeFile}"`)
      console.log(`[fix-dylib] Rewritten: ${dylibPath} -> ${newPath}`)
    }
  }
}
