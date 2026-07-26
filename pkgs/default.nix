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
    version = "0.1.27";
    tag = "gh-axi-v0.1.27";
    hash = "sha256-hehWN06+UhCAEACsqn54eNHywlnllY9qHn3c/Fu5Tto=";
    pnpmHash = "sha256-gLCR/5bGVOyacNU/QjDG8xvf7eg5bMNZ/UBALnTNssg=";
  };
  herdr = inputs.herdr.packages.${pkgs.stdenv.hostPlatform.system}.default;
  inherit hermes openspec;
  lavish-axi = pkgs.callPackage ./axi/package.nix {
    pname = "lavish-axi";
    version = "0.1.42";
    tag = "lavish-axi-v0.1.42";
    hash = "sha256-IcApX4Qpx7oy5x5uaeOlIFC/6pr/kjjcjjPjmCXk2DI=";
    pnpmHash = "sha256-ssuzj9LP5gvFJqtcbATRikCdefLKWPNzaa+5n26ggiI=";
  };
  no-mistakes = pkgs.callPackage ./no-mistakes/package.nix { };
  pi-coding-agent = pkgs.callPackage ./pi-coding-agent/package.nix {
    src = inputs.pi-coding-agent-src;
  };
  quota-axi = pkgs.callPackage ./axi/package.nix {
    pname = "quota-axi";
    version = "0.1.7";
    tag = "quota-axi-v0.1.7";
    hash = "sha256-M28Lfd5ToIPmSmE14FlB84Iu9kw47UhNyR4Pr9nyM2I=";
    pnpmHash = "sha256-bz01jPq/aD9AuSyf+7EwE/6ZxxNgCy98vwrRM6b11Yc=";
  };
  tasks-axi = pkgs.callPackage ./axi/package.nix {
    pname = "tasks-axi";
    version = "0.2.3";
    tag = "tasks-axi-v0.2.3";
    hash = "sha256-ziQJdRYtMsJW9xhRtrBiTjDe/5PcECXrBU9Wt9Tn7Vg=";
    pnpmHash = "sha256-3KdnJSGunTKVjvB63hb49ODw8ujkTdBNC0f1jHBX0zY=";
  };
  treehouse = inputs.treehouse.packages.${pkgs.stdenv.hostPlatform.system}.default;
}
