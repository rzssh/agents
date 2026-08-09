{
  lib,
  buildNpmPackage,
  fd,
  jq,
  ripgrep,
  src,
}:

buildNpmPackage {
  pname = "pi-coding-agent";
  version = "0.84.1";
  inherit src;

  npmDepsFetcherVersion = 2;
  npmDepsHash = "sha256-WwrhgBfs8SvKWziwmHO/RBlB/eE6vMmDZxE6iMZncY4=";
  makeCacheWritable = true;

  postPatch = ''
    ${jq}/bin/jq '
      .packages["node_modules/@earendil-works/pi-agent-core"].integrity = "sha512-evyzXYWCLQGmcaBYHlmSku02r8qoN4SGI60GZABo6iV+H+nqX+P9ud8fEZ4GmRq9mUSREvvfX+w9dA9ThF9C6w=="
      | .packages["node_modules/@earendil-works/pi-ai"].integrity = "sha512-wMsAdJMxuNri08vLqTyYVI201DQQezGhPSTkzYsHdw5dYX3rCNwEmSvpaAwhi7ELKI/2tE/CEgSWg/6iRxSgdQ=="
      | .packages["node_modules/@earendil-works/pi-client"].integrity = "sha512-/V5hGHE4Zq+jG0GtwIB9PyBUOGd6gBLZ7lkQYFKchKnxYHeH3rmWC5xw4kpnZKKBuBuFTdLVbU9vEjlAGMMb2A=="
      | .packages["node_modules/@earendil-works/pi-protocol"].integrity = "sha512-Ox1pciyeSPGEEUcxvR0/dJcrY7C6hrEGA8y71rOsvSIUlXN1Cbp/be/eoL71OGDBk5O97TeQPfWN6Ju/2Ehjww=="
      | .packages["node_modules/@earendil-works/pi-telemetry"].integrity = "sha512-180/xGJtsq7IoR3p9EKWjRd0e9M4DkxInhlo9xyD7prDC7Qrhqq+nhvwrW0lFjPfXcEI2FSHmGCSyvSJE9GsaQ=="
      | .packages["node_modules/@earendil-works/pi-tui"].integrity = "sha512-udeXFbgEhJ6JiB0uguwNVNkDy2FENfmtQwPcY+/iJ8GWeq18wkal1tKqa5YyeH0IqtX1vG0cGh8zfSYzyzVuLA=="
    ' npm-shrinkwrap.json > npm-shrinkwrap.json.new
    mv npm-shrinkwrap.json.new npm-shrinkwrap.json
    ${jq}/bin/jq 'del(.devDependencies)' package.json > package.json.new
    mv package.json.new package.json
  '';

  dontNpmBuild = true;

  postInstall = ''
    wrapProgram $out/bin/pi \
      --prefix PATH : ${
        lib.makeBinPath [
          fd
          ripgrep
        ]
      } \
      --set PI_SKIP_VERSION_CHECK 1 \
      --set PI_TELEMETRY 0
  '';

  meta = {
    description = "Minimal terminal coding agent harness";
    homepage = "https://pi.dev";
    license = lib.licenses.mit;
    mainProgram = "pi";
  };
}
