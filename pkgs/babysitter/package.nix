{
  lib,
  buildNpmPackage,
  makeWrapper,
  nodejs_24,
}:

buildNpmPackage {
  pname = "babysitter";
  version = "6.0.2";
  src = ./.;
  npmDepsHash = "sha256-fLdlhSwbFp9MHo77p56TdMuScSd7npA3qWmuBFfVRyQ=";
  env.PUPPETEER_SKIP_DOWNLOAD = "true";
  dontNpmBuild = true;
  nativeBuildInputs = [ makeWrapper ];
  installPhase = ''
    runHook preInstall
    mkdir -p $out/lib/babysitter $out/bin
    cp -r node_modules $out/lib/babysitter/
    find $out/lib/babysitter/node_modules -type d -path '*/prebuilds/*' \
      ! -path '*/prebuilds/linux-x64*' ! -path '*/prebuilds/linux-x64*/*' \
      -prune -exec rm -rf {} +
    makeWrapper ${nodejs_24}/bin/node $out/bin/babysitter \
      --add-flags "$out/lib/babysitter/node_modules/@a5c-ai/babysitter-sdk/dist/cli/main.js"
    runHook postInstall
  '';
  meta = {
    description = "Stateful orchestration CLI for coding agents";
    homepage = "https://github.com/a5c-ai/babysitter";
    license = lib.licenses.mit;
    mainProgram = "babysitter";
  };
}
