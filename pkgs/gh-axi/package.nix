{ callPackage }:

callPackage ../axi/package.nix rec {
  pname = "gh-axi";
  version = "0.1.35";
  tag = "${pname}-v${version}";
  hash = "sha256-zuShaNLCh+u5c+CTeX5cgMCk1PUTK8nd7D5zTjTqt9E=";
  pnpmHash = "sha256-Ps93wg2mN1g1Rq4SY1FuNh8g9CF3o1WjCtioBWLcogU=";
}
