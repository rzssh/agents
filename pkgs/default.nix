{ pkgs, inputs }:

let
  hermes = pkgs.callPackage "${inputs.hermes-agent}/nix/hermes-agent.nix" {
    inherit (inputs.hermes-agent.inputs) uv2nix pyproject-nix pyproject-build-systems;
    npm-lockfile-fix =
      inputs.hermes-agent.inputs.npm-lockfile-fix.packages.${pkgs.stdenv.hostPlatform.system}.default;
    rev = inputs.hermes-agent.rev or null;
  };
  openspec = inputs.openspec.packages.${pkgs.stdenv.hostPlatform.system}.default.overrideAttrs (old: {
    pnpmDeps = pkgs.fetchPnpmDeps {
      inherit (old) pname version src;
      pnpm = pkgs.pnpm_10;
      fetcherVersion = 3;
      hash = "sha256-yitHBdoabDcUbaixSKmOddpwrbi/bmxDcHP3okoxVqM=";
    };
    nativeBuildInputs = with pkgs; [
      nodejs_24
      npmHooks.npmInstallHook
      pnpmConfigHook
      pnpm_10
    ];
  });
in
{
  babysitter = pkgs.callPackage ./babysitter/package.nix { };
  chrome-devtools-axi = pkgs.callPackage ./axi/package.nix {
    pname = "chrome-devtools-axi";
    version = "0.1.26";
    tag = "chrome-devtools-axi-v0.1.26";
    hash = "sha256-csjr1T+a9MPNIw4qxk1TIgFUoGjB8jhrZ+oc6ObcDts=";
    pnpmHash = "sha256-eyOhZEsGecgLBvxIBPPvjw9MSJZ4rXIFyktz+Ax9qkE=";
  };
  chrome-devtools-mcp = pkgs.callPackage ./chrome-devtools-mcp/package.nix { };
  crit = inputs.crit.packages.${pkgs.stdenv.hostPlatform.system}.default;
  gh-axi = pkgs.callPackage ./axi/package.nix {
    pname = "gh-axi";
    version = "0.1.30";
    tag = "gh-axi-v0.1.30";
    hash = "sha256-E9SahmNcpY2a1Uy5CqLe3A5BIv1ecO/xZtZd6zGpv5c=";
    pnpmHash = "sha256-Ps93wg2mN1g1Rq4SY1FuNh8g9CF3o1WjCtioBWLcogU=";
  };
  herdr = inputs.herdr.packages.${pkgs.stdenv.hostPlatform.system}.default;
  inherit hermes openspec;
  lavish-axi = pkgs.callPackage ./axi/package.nix {
    pname = "lavish-axi";
    version = "0.1.47";
    tag = "lavish-axi-v0.1.47";
    hash = "sha256-fTu4iv55to5INLrlbb3g2f+IJDGzjuqkOpW1bgrGTm8=";
    pnpmHash = "sha256-ssuzj9LP5gvFJqtcbATRikCdefLKWPNzaa+5n26ggiI=";
  };
  no-mistakes = pkgs.callPackage ./no-mistakes/package.nix { };
  pi-coding-agent = pkgs.callPackage ./pi-coding-agent/package.nix {
    src = inputs.pi-coding-agent-src;
  };
  quota-axi = pkgs.callPackage ./axi/package.nix {
    pname = "quota-axi";
    version = "0.1.20";
    tag = "quota-axi-v0.1.20";
    hash = "sha256-0c5JLW+uIDrqk+nqJWsbxONVFxQ249AsEUi1Zu9ytKA=";
    pnpmHash = "sha256-AC2sT4JVE96ebyIPYEihMCn7Gp2sSlIcfeZEvVknjuA=";
  };
  tasks-axi = pkgs.callPackage ./axi/package.nix {
    pname = "tasks-axi";
    version = "0.2.5";
    tag = "tasks-axi-v0.2.5";
    hash = "sha256-obwgvKls8GljbUdFrl7ht9+k0AEQjdqvLGf4UHscv+M=";
    pnpmHash = "sha256-vZcUSa35SvRJoaeuSUuDpv54FJRtP1fxv+6+tR9euR0=";
  };
  treehouse = inputs.treehouse.packages.${pkgs.stdenv.hostPlatform.system}.default;
}
