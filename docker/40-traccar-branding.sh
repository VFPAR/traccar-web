#!/bin/sh
# Substitui os placeholders que o traccar-server trocava via OverrideTextFilter.
set -e

HTML_DIR=/usr/share/nginx/html

escape() {
    printf '%s' "$1" | sed -e 's/[\/&|]/\\&/g'
}

TITLE=$(escape "${APP_TITLE:-Traccar}")
DESCRIPTION=$(escape "${APP_DESCRIPTION:-Traccar GPS Tracking System}")
COLOR=$(escape "${APP_COLOR_PRIMARY:-#1a237e}")

for file in index.html manifest.webmanifest; do
    sed -e "s|\${title}|$TITLE|g" \
        -e "s|\${description}|$DESCRIPTION|g" \
        -e "s|\${colorPrimary}|$COLOR|g" \
        "$HTML_DIR/$file.tpl" > "$HTML_DIR/$file"
done

echo "traccar-web: branding aplicado (title=${APP_TITLE:-Traccar}), API em ${TRACCAR_API_URL}"
