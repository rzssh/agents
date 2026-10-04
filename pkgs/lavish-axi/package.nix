{ callPackage }:

callPackage ../axi/package.nix rec {
  pname = "lavish-axi";
  version = "0.1.81";
  tag = "${pname}-v${version}";
  hash = "sha256-7BtRdcR2WaoRPGDIWafzbglQCKt7L23GJwkNxyLwy2c=";
  pnpmHash = "sha256-g1MZOKo3DR4x9qGgxEN2Ab9YhQkQcOTupsr3mXtkr4w=";
}
