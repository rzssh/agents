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
  version = "0.84.2";
  inherit src;

  npmDepsFetcherVersion = 2;
  npmDepsHash = "sha256-LzeT2mpfceGxbjydta0d1MyptyFyS/5PK4t2J7l9/KI=";
  makeCacheWritable = true;

  postPatch = ''
    ${jq}/bin/jq '
      .packages["node_modules/@earendil-works/pi-agent-core"].integrity = "sha512-8Pn3wSCxj0cfo5I6jxQYVB/3uuQRmHhAlEclyjqpOuMEdQMIODHizRogv56FLdbU+dTiGnybeHQ2N+sV1/L2YA=="
      | .packages["node_modules/@earendil-works/pi-ai"].integrity = "sha512-6MzsrYIYNVlE7SfpbL2yYb67Qo58p/7Q+xWG1RZvoX1P80aRCHSod2/13aFpxkow1lPO2LEh3c495J0Gwmyjig=="
      | .packages["node_modules/@earendil-works/pi-client"].integrity = "sha512-/RFSPhD/bZbpOp1oJj+UneSUFSgZhWxzcSENUY+8+8xhoBrWXMYI2t77XNx4Yf+c8YK2qTHquForhNcelYpXvg=="
      | .packages["node_modules/@earendil-works/pi-protocol"].integrity = "sha512-jbBh03fkeckWEroHpcZBr4w5/Ibat8WwdXFlXHivYQImrQNFtLpDeL0t1cku4hmK0q3pceIRQHkw4fwbM4YILQ=="
      | .packages["node_modules/@earendil-works/pi-telemetry"].integrity = "sha512-wg5caea7uIv1BHRBm2Y116RvFG4oSAiP5qk9tA2463PDGIr4K8M1Ceyyg5DOpF/shUUl0gk826yQJAeAcHYB9g=="
      | .packages["node_modules/@earendil-works/pi-tui"].integrity = "sha512-ds2TLihOnM5sLJB3VpXV6y0uR5efVuHf4MN7yDpsty6hA2DUO/EDVzjp/0od0G2JslzVLMjT8T8zavtxVb+qbg=="
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
