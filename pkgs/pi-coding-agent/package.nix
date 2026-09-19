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
  version = "0.85.1";
  inherit src;

  npmDepsFetcherVersion = 2;
  npmDepsHash = "sha256-aNrpboCvJH9GOBiO0povbqbHuDwDLA+EeXgWysWeAj8=";
  makeCacheWritable = true;

  postPatch = ''
    ${jq}/bin/jq '
      .packages["node_modules/@earendil-works/chord"].integrity = "sha512-VDlkEC3dhCzQ5fcyH1OhG19dq+6jCn+rqc/iXFivwDYGR5anwo2RCiXij9PpHhqNR5GuhhE+Er69Zi1Sn4eY6w=="
      | .packages["node_modules/@earendil-works/pi-agent-core"].integrity = "sha512-hIXIP3eAWueAYiAl8aMvWCvvZ8Q5gT3Dip5bE5uJyIGh4+YlWRjtMLI4BaeoXoSs93zndjue61u1B/vhefLnuA=="
      | .packages["node_modules/@earendil-works/pi-ai"].integrity = "sha512-+VgVIJDkDO2efYJKEEqvPTH4zmnIaXdAppGbO+vKFA9qy5PdhFiAenuFAkU+oiCSfOC4dMHDyrjdQeL4ZoC5CQ=="
      | .packages["node_modules/@earendil-works/pi-telemetry"].integrity = "sha512-Bg/YN6kA7Swja/NQxka8xFdecb4E/auIEGF2G5A25EaQXhRnPj300/7/KpgsDDMYUzHTDAv4RyUxaQPJKW81Rw=="
      | .packages["node_modules/@earendil-works/pi-tui"].integrity = "sha512-OIzw9efInmO4WOBnD4TxcTdBjmzvYJpzslkgoUro946nEGoYWg5rwv1p4fDt3/JvMx9QybryUCUwlm7j8Dreig=="
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
