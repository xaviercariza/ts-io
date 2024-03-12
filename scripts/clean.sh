# clean.sh
#!/bin/bash

find . -type d \( -name 'node_modules' -or -name '.turbo' -or -name '.next' -or -name 'dist' \) -exec rm -rf {} \; 2>/dev/null || true
