{ inputs }:
{
  config,
  pkgs,
  lib,
  aiToolchainProfiles,
  ...
}:

let
  source = "${config.home.homeDirectory}/projects/agents";
  link = path: config.lib.file.mkOutOfStoreSymlink "${source}/${path}";
  aiRun = "${lib.getExe pkgs.python3} ${source}/bin/ai-run";
  localPkgs = import ../pkgs { inherit pkgs inputs; };
  inherit (localPkgs)
    crit
    herdr
    hermes
    openspec
    treehouse
    tuicr
    ;
  herdrSkill = pkgs.runCommand "herdr-skill" { } ''
    mkdir -p "$out"
    ${herdr}/bin/herdr --skill > "$out/SKILL.md"
  '';
  cargoHome = "${config.home.homeDirectory}/.cargo";
  chromeDevtoolsMcpPath = "${localPkgs.chrome-devtools-mcp}/lib/node_modules/chrome-devtools-mcp/build/src/bin/chrome-devtools-mcp.js";
  npmCache = "${config.home.homeDirectory}/.npm";
  projectsRoot = "${config.home.homeDirectory}/projects";
  profileArguments = lib.escapeShellArgs aiToolchainProfiles;
  clients = {
    pi = {
      executable = lib.getExe localPkgs.pi-coding-agent;
      credentials = null;
      homes.PI_CODING_AGENT_DIR = "~/.pi/agent:pi";
    };
    codex = {
      executable = "${config.home.homeDirectory}/.local/bin/codex";
      credentials = [ "OPENAI_API_KEY" ];
      homes.CODEX_HOME = "~/.codex:codex";
    };
    claude = {
      executable = "${config.home.homeDirectory}/.local/bin/claude";
      credentials = [
        "ANTHROPIC_API_KEY"
        "ANTHROPIC_AUTH_TOKEN"
        "CLAUDE_CODE_OAUTH_TOKEN"
      ];
      homes.CLAUDE_CONFIG_DIR = "~/.claude:claude";
    };
    opencode = {
      executable = lib.getExe pkgs.opencode;
      credentials = null;
      homes = {
        XDG_CACHE_HOME = "~/.cache:opencode/cache";
        XDG_CONFIG_HOME = "~/.config:opencode/config";
        XDG_DATA_HOME = "~/.local/share:opencode/data";
        XDG_STATE_HOME = "~/.local/state:opencode/state";
      };
    };
    hermes = {
      executable = "${hermes}/bin/hermes";
      credentials = [ ];
      homes.HERMES_HOME = "~/.hermes:hermes";
    };
  };
  homeArgs =
    client:
    lib.concatStringsSep " " (
      lib.mapAttrsToList (name: value: "--home ${lib.escapeShellArg "${name}=${value}"}") client.homes
    );
  credentialArgs =
    client:
    if client.credentials == null then
      "--all-credentials"
    else
      lib.concatMapStringsSep " " (name: "--credential ${lib.escapeShellArg name}") client.credentials;
  clientArgs =
    client:
    lib.concatStringsSep " " [
      (credentialArgs client)
      (homeArgs client)
    ];
  wrappers = lib.mapAttrs (
    name: client:
    pkgs.writeShellScript "ai-${name}" (
      if name == "pi" then
        ''
          profile="''${AI_PROFILE:-''${AI_DEFAULT_PROFILE:-personal}}"
          export CARGO_HOME=${lib.escapeShellArg cargoHome}
          export CHROME_DEVTOOLS_AXI_MCP_PATH=${lib.escapeShellArg chromeDevtoolsMcpPath}
          export CHROME_DEVTOOLS_EXECUTABLE_PATH=${lib.escapeShellArg (lib.getExe pkgs.google-chrome)}
          export NPM_CONFIG_CACHE=${lib.escapeShellArg npmCache}
          export PI_PROJECTS_ROOT=${lib.escapeShellArg projectsRoot}
          export PI_SANDBOX_BWRAP_PATH=${lib.escapeShellArg (lib.getExe pkgs.bubblewrap)}
          export PI_SANDBOX_RG_PATH=${lib.escapeShellArg (lib.getExe pkgs.ripgrep)}
          export PI_SANDBOX_RUNTIME_PATH=${lib.escapeShellArg "${pkgs.sandbox-runtime}/lib/node_modules/@anthropic-ai/sandbox-runtime/dist/index.js"}
          sandbox="${source}/agents/pi/extensions/sandbox.ts"
          sandbox_args=(--extension "$sandbox")
          case "''${1:-}" in
            install|remove|uninstall|update|list|config) sandbox_args=() ;;
          esac
          exec ${aiRun} ${clientArgs client} "$profile" -- ${client.executable} "''${sandbox_args[@]}" "$@"
        ''
      else if name == "claude" then
        ''
          profile="''${AI_PROFILE:-''${AI_DEFAULT_PROFILE:-personal}}"
          permission_args=(--dangerously-skip-permissions)
          for arg in "$@"; do
            if [ "$arg" = --dangerously-skip-permissions ]; then
              permission_args=()
              break
            fi
          done
          exec ${aiRun} ${clientArgs client} "$profile" -- ${client.executable} "''${permission_args[@]}" "$@"
        ''
      else if name == "codex" then
        ''
          profile="''${AI_PROFILE:-''${AI_DEFAULT_PROFILE:-personal}}"
          permission_args=(--dangerously-bypass-approvals-and-sandbox)
          for arg in "$@"; do
            if [ "$arg" = --dangerously-bypass-approvals-and-sandbox ]; then
              permission_args=()
              break
            fi
          done
          exec ${aiRun} ${clientArgs client} "$profile" -- ${client.executable} "''${permission_args[@]}" "$@"
        ''
      else if name == "opencode" then
        ''
          profile="''${AI_PROFILE:-''${AI_DEFAULT_PROFILE:-personal}}"
          export OPENCODE_CONFIG_CONTENT='{"permission":{"*":"allow"}}'
          exec ${aiRun} ${clientArgs client} "$profile" -- ${client.executable} "$@"
        ''
      else
        ''
          profile="''${AI_PROFILE:-''${AI_DEFAULT_PROFILE:-personal}}"
          exec ${aiRun} ${clientArgs client} "$profile" -- ${client.executable} "$@"
        ''
    )
  ) clients;
  wrapperFiles = lib.mapAttrs' (
    name: source: lib.nameValuePair ".local/share/ai/bin/${name}" { inherit source; }
  ) wrappers;
in
{
  home.sessionPath = [
    "$HOME/.local/share/ai/bin"
    "$HOME/.local/bin"
  ];

  home.sessionVariables = {
    AI_DEFAULT_PROFILE = "personal";
    CARGO_HOME = cargoHome;
    CAVEMAN_DEFAULT_MODE = "ultra";
    CHROME_DEVTOOLS_AXI_MCP_PATH = chromeDevtoolsMcpPath;
    CHROME_DEVTOOLS_EXECUTABLE_PATH = lib.getExe pkgs.google-chrome;
    OPENSPEC_TELEMETRY = "0";
    NO_MISTAKES_TELEMETRY = "0";
    NO_MISTAKES_NO_UPDATE_CHECK = "1";
    NPM_CONFIG_CACHE = npmCache;
    PI_PROJECTS_ROOT = projectsRoot;
    PONYTAIL_DEFAULT_MODE = "full";
    QUOTA_AXI_CODEX_BINARY = "${config.home.homeDirectory}/.local/bin/codex";
    SEARXNG_URL = "http://127.0.0.1:8888";
  };

  home.packages = [
    localPkgs.babysitter
    localPkgs.chrome-devtools-axi
    localPkgs.chrome-devtools-mcp
    localPkgs.gh-axi
    localPkgs.lavish-axi
    localPkgs.no-mistakes
    localPkgs.quota-axi
    localPkgs.tasks-axi
    crit
    openspec
    pkgs.opencode
    pkgs.socat
    hermes
    herdr
    treehouse
    tuicr
  ];

  home.file = wrapperFiles // {
    ".local/bin/ai-run".source = link "bin/ai-run";
    ".local/bin/pi".source = wrappers.pi;
    ".local/share/ai/bin/chrome-devtools".source =
      "${localPkgs.chrome-devtools-mcp}/bin/chrome-devtools";
    ".local/bin/ai-workspace".source = link "bin/ai-workspace";
    ".local/bin/ai-workspace-picker".source = link "bin/ai-workspace-picker";
    ".local/bin/firstmate".source = link "bin/firstmate";
    ".claude/CLAUDE.md".source = link "agents/AGENTS.md";
    ".codex/AGENTS.md".source = link "agents/AGENTS.md";
    ".pi/agent/AGENTS.md".source = link "agents/AGENTS.md";
    ".pi/agent/extensions/web.ts".source = link "agents/pi/extensions/web.ts";
    ".pi/agent/lib/web.ts".source = link "agents/pi/lib/web.ts";
    ".config/opencode/AGENTS.md".source = link "agents/AGENTS.md";
    ".config/opencode/plugins/profile-protection.js".source =
      link "agents/opencode/plugins/profile-protection.js";
    ".agents/skills/capture-knowledge".source = link "agents/skills/capture-knowledge";
    ".agents/skills/delegate-work".source = link "agents/skills/delegate-work";
    ".agents/skills/herdr-agent-comms".source = link "agents/skills/herdr-agent-comms";
    ".agents/skills/herdr/SKILL.md" = {
      source = "${herdrSkill}/SKILL.md";
      force = true;
    };
    ".agents/skills/teach-code".source = link "agents/skills/teach-code";
    ".agents/skills/tuicr".source = "${inputs.tuicr}/skills/tuicr";
    ".agents/skills/use-browser".source = link "agents/skills/use-browser";
    ".agents/skills/web-research".source = link "agents/skills/web-research";
    ".claude/skills/delegate-work".source = link "agents/skills/delegate-work";
    ".claude/skills/herdr-agent-comms".source = link "agents/skills/herdr-agent-comms";
    ".claude/skills/capture-knowledge".source = link "agents/skills/capture-knowledge";
    ".claude/skills/teach-code".source = link "agents/skills/teach-code";
    ".claude/skills/tuicr".source = "${inputs.tuicr}/skills/tuicr";
    ".claude/skills/use-browser".source = link "agents/skills/use-browser";
    ".claude/skills/web-research".source = link "agents/skills/web-research";
  };

  home.activation.agentProfiles = lib.hm.dag.entryAfter [ "linkGeneration" "sops-nix" ] ''
    umask 077

    json_overlay() {
      source=$1
      target=$2
      directory="$(${pkgs.coreutils}/bin/dirname "$target")"
      ${pkgs.coreutils}/bin/mkdir -p "$directory"
      ${pkgs.coreutils}/bin/chmod 700 "$directory"
      current="$(${pkgs.coreutils}/bin/mktemp "$directory/.current.XXXXXX")"
      merged="$(${pkgs.coreutils}/bin/mktemp "$directory/.merged.XXXXXX")"
      if [ -e "$target" ]; then
        ${pkgs.coreutils}/bin/cp -L "$target" "$current"
      else
        printf '{}\n' > "$current"
      fi
      ${pkgs.jq}/bin/jq -e 'type == "object"' "$current" >/dev/null
      ${pkgs.jq}/bin/jq -s '.[0] * .[1]' "$current" "$source" > "$merged"
      ${pkgs.coreutils}/bin/chmod 600 "$merged"
      ${pkgs.coreutils}/bin/mv -f "$merged" "$target"
      ${pkgs.coreutils}/bin/rm -f "$current"
    }

    yaml_overlay() {
      source=$1
      target=$2
      directory="$(${pkgs.coreutils}/bin/dirname "$target")"
      ${pkgs.coreutils}/bin/mkdir -p "$directory"
      ${pkgs.coreutils}/bin/chmod 700 "$directory"
      current="$(${pkgs.coreutils}/bin/mktemp "$directory/.current.XXXXXX")"
      current_json="$(${pkgs.coreutils}/bin/mktemp "$directory/.current-json.XXXXXX")"
      source_json="$(${pkgs.coreutils}/bin/mktemp "$directory/.source-json.XXXXXX")"
      merged_json="$(${pkgs.coreutils}/bin/mktemp "$directory/.merged-json.XXXXXX")"
      merged="$(${pkgs.coreutils}/bin/mktemp "$directory/.merged.XXXXXX")"
      if [ -e "$target" ]; then
        ${pkgs.coreutils}/bin/cp -L "$target" "$current"
      else
        printf '{}\n' > "$current"
      fi
      ${pkgs.yq-go}/bin/yq -o=json "$current" > "$current_json"
      ${pkgs.yq-go}/bin/yq -o=json "$source" > "$source_json"
      ${pkgs.jq}/bin/jq -s '.[0] * .[1]' "$current_json" "$source_json" > "$merged_json"
      ${pkgs.yq-go}/bin/yq -p=json -o=yaml -P "$merged_json" > "$merged"
      ${pkgs.coreutils}/bin/chmod 600 "$merged"
      ${pkgs.coreutils}/bin/mv -f "$merged" "$target"
      ${pkgs.coreutils}/bin/rm -f "$current" "$current_json" "$source_json" "$merged_json"
    }

    managed_link() {
      source=$1
      target=$2
      ${pkgs.coreutils}/bin/mkdir -p "$(${pkgs.coreutils}/bin/dirname "$target")"
      ${pkgs.coreutils}/bin/ln -sfnT "$source" "$target"
    }

    ${pkgs.coreutils}/bin/mkdir -p "$HOME/.local/share/ai/profiles"
    ${pkgs.coreutils}/bin/chmod 700 "$HOME/.local/share/ai" "$HOME/.local/share/ai/profiles"

    for profile in ${profileArguments}; do
      if [ "$profile" = personal ]; then
        claude="$HOME/.claude"
        codex="$HOME/.codex"
        gh="$HOME/.config/gh"
        hermes_home="$HOME/.hermes"
        opencode="$HOME/.config/opencode"
        pi="$HOME/.pi/agent"
      else
        root="$HOME/.local/share/ai/profiles/$profile"
        claude="$root/claude"
        codex="$root/codex"
        gh="$root/gh"
        hermes_home="$root/hermes"
        opencode="$root/opencode/config/opencode"
        pi="$root/pi"
      fi

      for directory in "$claude" "$codex" "$gh" "$hermes_home" "$opencode" "$pi"; do
        ${pkgs.coreutils}/bin/mkdir -p "$directory"
        ${pkgs.coreutils}/bin/chmod 700 "$directory"
      done

      if [ "$profile" != personal ]; then
        managed_link "${source}/agents/AGENTS.md" "$claude/CLAUDE.md"
        managed_link "${source}/agents/skills/capture-knowledge" "$claude/skills/capture-knowledge"
        managed_link "${source}/agents/skills/delegate-work" "$claude/skills/delegate-work"
        managed_link "${source}/agents/skills/herdr-agent-comms" "$claude/skills/herdr-agent-comms"
        managed_link "${source}/agents/skills/teach-code" "$claude/skills/teach-code"
        managed_link "${inputs.tuicr}/skills/tuicr" "$claude/skills/tuicr"
        managed_link "${source}/agents/skills/use-browser" "$claude/skills/use-browser"
        managed_link "${source}/agents/skills/web-research" "$claude/skills/web-research"
        managed_link "${source}/agents/AGENTS.md" "$codex/AGENTS.md"
        managed_link "${source}/agents/AGENTS.md" "$pi/AGENTS.md"
        managed_link "${source}/agents/pi/extensions/web.ts" "$pi/extensions/web.ts"
        managed_link "${source}/agents/pi/lib/web.ts" "$pi/lib/web.ts"
        managed_link "${source}/agents/AGENTS.md" "$opencode/AGENTS.md"
        managed_link "${source}/agents/opencode/plugins/profile-protection.js" "$opencode/plugins/profile-protection.js"
      fi

      ${pkgs.coreutils}/bin/rm -f "$pi/extensions/profile-protection.ts" "$pi/extensions/workspace-sandbox.ts"

      json_overlay "${source}/agents/claude/settings.json" "$claude/settings.json"
      json_overlay "${source}/agents/pi/settings.json" "$pi/settings.json"
      yaml_overlay "${source}/agents/hermes/config.yaml" "$hermes_home/config.yaml"

      ${aiRun} ${homeArgs clients.pi} "$profile" -- ${herdr}/bin/herdr integration install pi >/dev/null
      ${aiRun} ${homeArgs clients.claude} "$profile" -- ${herdr}/bin/herdr integration install claude >/dev/null
      ${aiRun} ${homeArgs clients.codex} "$profile" -- ${herdr}/bin/herdr integration install codex >/dev/null
      ${aiRun} ${homeArgs clients.opencode} "$profile" -- ${herdr}/bin/herdr integration install opencode >/dev/null
      ${aiRun} ${homeArgs clients.hermes} "$profile" -- ${herdr}/bin/herdr integration install hermes >/dev/null
    done
  '';

  home.activation.noMistakesDaemon = lib.hm.dag.entryAfter [ "agentProfiles" ] ''
    export NO_MISTAKES_TELEMETRY=0
    export NO_MISTAKES_NO_UPDATE_CHECK=1
    export PATH="$HOME/.local/share/ai/bin:$HOME/.local/bin:${
      lib.makeBinPath [
        localPkgs.chrome-devtools-axi
        localPkgs.gh-axi
        localPkgs.lavish-axi
        localPkgs.no-mistakes
        localPkgs.quota-axi
        localPkgs.tasks-axi
        pkgs.gh
        pkgs.git
        pkgs.nodejs_24
        crit
        herdr
        treehouse
      ]
    }:/run/current-system/sw/bin:$HOME/.nix-profile/bin:$PATH"
    if ! ${lib.getExe localPkgs.no-mistakes} daemon start >/dev/null; then
      ${lib.getExe localPkgs.no-mistakes} daemon status >/dev/null
    fi
  '';
}
