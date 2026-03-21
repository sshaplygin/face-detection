# 1. Инструменты
export LLVM_PREFIX=$(brew --prefix llvm)
export LIBCLANG_PATH="$LLVM_PREFIX/lib"
export PATH="$LLVM_PREFIX/bin:$PATH"

# 2. Системный SDK
export SDKROOT=$(xcrun --show-sdk-path)

# 3. OpenCV Пути
export OPENCV_INCLUDE_PATHS="/opt/homebrew/opt/opencv/include/opencv4"
export OPENCV_LINK_PATHS="/opt/homebrew/opt/opencv/lib"

# 4. Флаги для компилятора (указываем на SDK и OpenCV)
export CLANG_FLAGS="-isysroot $SDKROOT -I/opt/homebrew/opt/opencv/include/opencv4 -I$LLVM_PREFIX/include"
export CPLUS_INCLUDE_PATH="/opt/homebrew/opt/opencv/include/opencv4:$LLVM_PREFIX/include:$SDKROOT/usr/include"

# 5. Запуск сборки
napi build --manifest-path native/Cargo.toml --platform --js false --dts native/index.d.ts --output-dir .