{
  lib,
  stdenvNoCC,
  fetchurl,
  makeWrapper,
  nodejs_24,
}:

let
  version = "1.10.1";
in
stdenvNoCC.mkDerivation {
  pname = "chrome-devtools-mcp";
  inherit version;

  src = fetchurl {
    url = "https://registry.npmjs.org/chrome-devtools-mcp/-/chrome-devtools-mcp-${version}.tgz";
    hash = "sha256-ASy89ugy1PZwna0MIde+8XCJ6Ure6c8zF50V6gqa3ys=";
  };

  sourceRoot = "package";
  nativeBuildInputs = [ makeWrapper ];

  installPhase = ''
    runHook preInstall
    root="$out/lib/node_modules/chrome-devtools-mcp"
    mkdir -p "$root" "$out/bin"
    cp -r . "$root"
    makeWrapper ${lib.getExe nodejs_24} "$out/bin/chrome-devtools-mcp" \
      --add-flags "$root/build/src/bin/chrome-devtools-mcp.js"
    makeWrapper ${lib.getExe nodejs_24} "$out/bin/chrome-devtools" \
      --add-flags "$root/build/src/bin/chrome-devtools.js"
    runHook postInstall
  '';

  meta = {
    homepage = "https://github.com/ChromeDevTools/chrome-devtools-mcp";
    license = lib.licenses.asl20;
    mainProgram = "chrome-devtools";
  };
}
