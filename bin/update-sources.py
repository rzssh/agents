import json
import re
import sys
import urllib.request
from pathlib import Path


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "razen-update"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def github(repo, endpoint):
    return fetch(f"https://api.github.com/repos/{repo}/{endpoint}")


def update_flake(path):
    def latest(match):
        repo = match[1]
        tag = github(repo, "releases/latest")["tag_name"]
        if not re.fullmatch(r"[A-Za-z0-9._+-]+", tag):
            raise ValueError(f"Invalid release tag for {repo}: {tag}")
        return f'"github:{repo}/{tag}"'

    source = path.read_text()
    updated = re.sub(r'"github:([\w.-]+/[\w.-]+)/v[^"/]+"', latest, source)
    if updated != source:
        path.write_text(updated)


def update_packages(path):
    original = path.read_text()
    updated_settings = original
    settings = json.loads(original)
    for package in settings["packages"]:
        source = package["source"] if isinstance(package, dict) else package
        if source.startswith("npm:"):
            match = re.fullmatch(r"npm:((?:@[^/@]+/)?[^/@]+)(?:@[^@]+)?", source)
            if match is None:
                raise ValueError(f"Invalid npm source: {source}")
            name = match[1]
            version = fetch(f"https://registry.npmjs.org/{name}/latest")["version"]
            if not re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?", version):
                raise ValueError(f"Invalid npm version for {name}: {version}")
            updated = f"npm:{name}@{version}"
        elif source.startswith("git:github.com/"):
            repo = source[len("git:github.com/") :].rsplit("@", 1)[0]
            revision = github(repo, "commits/HEAD")["sha"]
            if not re.fullmatch(r"[0-9a-f]{40}", revision):
                raise ValueError(f"Invalid revision for {repo}: {revision}")
            updated = f"git:github.com/{repo}@{revision}"
        else:
            continue
        updated_settings = updated_settings.replace(
            json.dumps(source), json.dumps(updated)
        )
    if updated_settings != original:
        path.write_text(updated_settings)


if __name__ == "__main__":
    update_flake(Path(sys.argv[1]))
    if len(sys.argv) > 2:
        update_packages(Path(sys.argv[2]))
