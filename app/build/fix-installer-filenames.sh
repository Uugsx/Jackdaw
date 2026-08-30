# Run from app/build/ directory

# Include ARM in artifact name, to avoid overwriting Intel artifacts
# Using Runner variables <https://docs.github.com/en/actions/reference/workflows-and-actions/variables>
if [ "$RUNNER_ARCH" = "ARM64" ] || [ "$RUNNER_ARCH" = "ARM" ]; then
  perl -p -i \
    -e 'if (/appImage:/ ... /artifactName:/) { s|(\$\{name\}-\$\{version\})\.(\$\{ext\})|$1-\${arch}.$2|g }' \
    -e 's|\$\{name\}-\$\{version\}-setup\.\$\{ext\}|\$\{name\}-\$\{version\}-\${arch}-setup.\$\{ext\}|g' \
    ../../desktop/electron-builder.yml
fi
