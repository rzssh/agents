{
  lib,
  buildNpmPackage,
  fd,
  git,
  jq,
  nodejs,
  openssh,
  ripgrep,
  src,
}:

buildNpmPackage {
  pname = "pi-coding-agent";
  version = "1.0.1";
  inherit src;

  npmDepsFetcherVersion = 2;
  npmDepsHash = "sha256-O/yr0kXcOAwe64oe40WIjK8wuaWajO+pa8DT9aJSmKo=";
  makeCacheWritable = true;

  postPatch = ''
    cp ${./package-lock.json} package-lock.json
    ${jq}/bin/jq 'del(.devDependencies)' package.json > package.json.new
    mv package.json.new package.json
  '';

  dontNpmBuild = true;
  npmPackFlags = [ "--ignore-scripts" ];

  postInstall = ''
    wrapProgram $out/bin/pi \
      --prefix PATH : ${
        lib.makeBinPath [
          fd
          git
          nodejs
          openssh
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
