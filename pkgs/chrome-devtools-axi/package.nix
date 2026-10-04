{ callPackage }:

callPackage ../axi/package.nix rec {
  pname = "chrome-devtools-axi";
  version = "0.1.38";
  tag = "${pname}-v${version}";
  hash = "sha256-sN2nvkQYqJ1rngVNq7Sxh5nzelTASWVNEUXxMb5dmOg=";
  pnpmHash = "sha256-bkR7KrArylGtteCEwBSQeMsi0J2CJvdMV3TCATPwWt4=";
}
