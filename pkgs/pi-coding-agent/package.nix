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
  version = "0.99.1";
  inherit src;

  npmDepsFetcherVersion = 2;
  npmDepsHash = "sha256-UwNqfF7op4NjB3jtOb/HZfXtRTpV7kdCTUFNz2gcI3o=";
  makeCacheWritable = true;

  postPatch = ''
    ${jq}/bin/jq '
      .packages["node_modules/@earendil-works/chord"].integrity = "sha512-4xyn0IBzJ+Xu/iOGi2hjXJGAR61QEhEWZsIqTDqr+GmItdquYwBO5jYFnqGiBaTqlY12/EpM7QHoEKSHbyvOug=="
      | .packages["node_modules/@earendil-works/pi-agent-core"].integrity = "sha512-zywvWnj5FujeuFI/x/CJHwwxhcLIQgjqseTA+bQgX4O8gJTcgjRd/I8SZnQDqJvxC9QcV12ujiGLviv6EgwcCg=="
      | .packages["node_modules/@earendil-works/pi-ai"].integrity = "sha512-4nV9JKc94iPX8bwdGPc2nTuVPKIPsffhnp3WoN9NYCNqbtoOF8LhYcIs/+Sn/alroqJK/5QRu6/Z6Ck+n0hyBA=="
      | .packages["node_modules/@earendil-works/pi-codemode"].integrity = "sha512-oh8TMsBI3SWTN3xTQtX8u5n+BKhnVXcFagroWumfn6/WWfBnDYL/LmeQtjLb83WRTb9rcu+ZdK8rFa4vggvCJg=="
      | .packages["node_modules/@earendil-works/pi-mcp"].integrity = "sha512-YCFGPkmDzLwQuIzwfbP6Vuk/g/ukKpZhwTpbcfzomuI1Fkiu6hHRkOGwAqsO3G8cTkZWkM8vmOkFJjStQNC4qA=="
      | .packages["node_modules/@earendil-works/pi-telemetry"].integrity = "sha512-9PBPjGk+TXRtuMianpqBbHBpYpyKusESF6rwdmgD0WTZSTUQXhcKEO0hAINRLuSwy4V7yPvXV+EVV0ONY7mbpQ=="
      | .packages["node_modules/@earendil-works/pi-tui"].integrity = "sha512-gZp0Guat96Fr1AuC/xqVz5B2lulZakp/PxD1lXx3lSgBdjiqmwYhJbcQ0HRrGAfy0WtMGn9b05RJr5qJf7oIuw=="
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
