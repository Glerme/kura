#!/bin/bash
# Generates a changelog from conventional commits between the previous tag and the current one.
# Usage: ./scripts/generate-changelog.sh [tag]
# If no tag is provided, uses the latest tag.

set -euo pipefail

CURRENT_TAG="${1:-$(git describe --tags --abbrev=0)}"
PREVIOUS_TAG=$(git describe --tags --abbrev=0 "${CURRENT_TAG}^" 2>/dev/null || echo "")

if [ -z "$PREVIOUS_TAG" ]; then
  RANGE="$CURRENT_TAG"
  HEADER="All changes up to **${CURRENT_TAG}**"
else
  RANGE="${PREVIOUS_TAG}..${CURRENT_TAG}"
  HEADER="Changes from **${PREVIOUS_TAG}** to **${CURRENT_TAG}**"
fi

echo "## ${HEADER}"
echo ""

declare -A SECTIONS=(
  ["feat"]="🚀 Features"
  ["fix"]="🐛 Bug Fixes"
  ["refactor"]="♻️ Refactors"
  ["test"]="✅ Tests"
  ["chore"]="🔧 Chores"
  ["docs"]="📝 Documentation"
  ["style"]="🎨 Style"
  ["perf"]="⚡ Performance"
  ["ci"]="👷 CI"
)

ORDER=("feat" "fix" "refactor" "perf" "test" "docs" "style" "ci" "chore")

HAS_CONTENT=false

for TYPE in "${ORDER[@]}"; do
  COMMITS=$(git log "$RANGE" --pretty=format:"- %s (%h)" --grep="^${TYPE}:" --no-merges 2>/dev/null || true)
  if [ -n "$COMMITS" ]; then
    HAS_CONTENT=true
    echo "### ${SECTIONS[$TYPE]}"
    echo ""
    echo "$COMMITS" | sed "s/^- ${TYPE}: /- /; s/^- ${TYPE}(/- (/"
    echo ""
  fi
done

# Uncategorized commits (don't match any conventional prefix)
ALL_CONVENTIONAL=$(printf '^%s:\|^%s(' "$(IFS='|'; echo "${ORDER[*]}")" "" | sed 's/ /\\|^/g')
UNCATEGORIZED=$(git log "$RANGE" --pretty=format:"- %s (%h)" --no-merges 2>/dev/null | grep -v -E "^- (feat|fix|refactor|test|chore|docs|style|perf|ci)[:(]" || true)
if [ -n "$UNCATEGORIZED" ]; then
  HAS_CONTENT=true
  echo "### 📦 Other"
  echo ""
  echo "$UNCATEGORIZED"
  echo ""
fi

if [ "$HAS_CONTENT" = false ]; then
  echo "No changes found."
  echo ""
fi
