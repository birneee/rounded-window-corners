# Expand path patterns like **/*.ui
set shell := ['bash', '-O', 'globstar', '-c']

buildDir := './_build'
uuid := 'rounded-window-corners@fxgn'

# Compile the extension and all resources
build: && pot
  npm install
  npx tsc --outDir {{buildDir}}
  cp -r ./resources/* {{buildDir}}
  glib-compile-schemas {{buildDir}}/schemas

# Build and install the extension from source
install: build
  rm -rf ~/.local/share/gnome-shell/extensions/{{uuid}}
  cp -r {{buildDir}} ~/.local/share/gnome-shell/extensions/{{uuid}}

# Build and pack the extension
pack:
  cd {{buildDir}} && zip -9r ../{{uuid}}.shell-extension.zip .

# Delete the build directory
clean:
  rm -rf {{buildDir}}
  
# Update and compile the translation files
pot:
  xgettext --from-code=UTF-8 \
           --output=po/{{uuid}}.pot \
           src/**/*.ui

  xgettext --from-code=UTF-8 \
           --output=po/{{uuid}}.pot \
           --language=JavaScript \
           --join-existing \
           src/**/*.ts

  for file in po/*.po; do \
    echo -e "\033[0;32mUpdating $file"; \
    msgmerge -q -U --backup=off $file po/{{uuid}}.pot; \
  done;

  for file in po/*.po; do \
    echo -e "\033[0;32mCompiling $file"; \
    locale=$(basename $file .po); \
    dir="{{buildDir}}/locale/$locale/LC_MESSAGES"; \
    mkdir -p $dir; \
    msgfmt -o $dir/{{uuid}}.mo $file; \
  done;