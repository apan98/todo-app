#!/bin/bash

echo "Checking imports in all TypeScript files..."

for file in *.ts *.tsx; do
    echo "=== $file ==="
    grep -h "^import" "$file" 2>/dev/null | sed 's/from.*/from .../' | sort | uniq
    echo
done
