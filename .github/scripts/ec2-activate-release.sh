#!/usr/bin/env bash
set -euo pipefail

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "${NVM_DIR}/nvm.sh" ]]; then
	source "${NVM_DIR}/nvm.sh"
fi

: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${GITHUB_SHA:?GITHUB_SHA is required}"
: "${RELEASE_RETENTION:?RELEASE_RETENTION is required}"

RELEASE_DIR="${DEPLOY_PATH}/releases/${GITHUB_SHA}"
SHARED_ENV="${DEPLOY_PATH}/shared/.env"

rm -rf "${RELEASE_DIR}"
mkdir -p "${RELEASE_DIR}"
tar xzf "${DEPLOY_PATH}/release.tgz" -C "${RELEASE_DIR}"
rm -f "${DEPLOY_PATH}/release.tgz"

cd "${RELEASE_DIR}"
npm ci

set -a
if [[ -f "${SHARED_ENV}" ]]; then
	source "${SHARED_ENV}"
fi
set +a

if [[ -z "${POSTGRES_URL:-}" ]]; then
	echo "POSTGRES_URL is not set. Add it to ${SHARED_ENV} on the server." >&2
	exit 1
fi

npm run db:migrate:deploy -w apps/backend
npm run db:generate -w apps/backend

ln -sfn "${RELEASE_DIR}" "${DEPLOY_PATH}/current"
cd "${DEPLOY_PATH}/current"

pm2 startOrReload ecosystem.config.cjs --env production --update-env
pm2 save

ACTIVE_RELEASE="$(readlink -f "${DEPLOY_PATH}/current")"
cd "${DEPLOY_PATH}/releases"

ls -1t | tail -n +"$((RELEASE_RETENTION + 1))" | while read -r rel; do
	[[ -z "${rel}" ]] && continue
	CANDIDATE="$(readlink -f "${DEPLOY_PATH}/releases/${rel}")"
	[[ "${CANDIDATE}" == "${ACTIVE_RELEASE}" ]] && continue
	rm -rf "${DEPLOY_PATH}/releases/${rel}"
done
