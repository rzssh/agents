{ callPackage }:

callPackage ../axi/package.nix rec {
  pname = "quota-axi";
  version = "0.1.56";
  tag = "${pname}-v${version}";
  hash = "sha256-UingBvYxdudiHp1lI2culgCe5Xlx8x5DIgB6RsLn2QQ=";
  pnpmHash = "sha256-3/wWfyrXVF0iTCZhCUgOmfuhNskq9kAw6dIQjHnxpHs=";
}
