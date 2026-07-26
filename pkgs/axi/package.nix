{
  lib,
  stdenv,
  fetchFromGitHub,
  fetchPnpmDeps,
  nodejs_24,
  pnpm_10,
  pnpmConfigHook,
  npmHooks,
  pname,
  version,
  tag,
  hash,
  pnpmHash,
}:

stdenv.mkDerivation (finalAttrs: {
  inherit pname version;

  src = fetchFromGitHub {
    owner = "kunchenguid";
    repo = pname;
    inherit tag hash;
  };

  pnpmDeps = fetchPnpmDeps {
    inherit (finalAttrs) pname version src;
    pnpm = pnpm_10;
    fetcherVersion = 3;
    hash = pnpmHash;
  };

  nativeBuildInputs = [
    nodejs_24
    pnpm_10
    pnpmConfigHook
    npmHooks.npmInstallHook
  ];

  buildPhase = ''
    runHook preBuild
    pnpm run build
    runHook postBuild
  '';

  dontNpmPrune = true;

  meta = {
    homepage = "https://github.com/kunchenguid/${pname}";
    license = lib.licenses.mit;
    mainProgram = pname;
  };
})
