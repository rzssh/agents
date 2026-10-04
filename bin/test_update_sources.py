import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location(
    "update_sources", Path(__file__).with_name("update-sources.py")
)
updater = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updater)


class UpdateSourcesTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(dir=Path(__file__).parent)
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "source"

    def test_release_updates_preserve_expensive_and_rolling_inputs(self):
        source = '"github:boot/loader/v1.0.0" "github:NixOS/nixpkgs/abc123" "github:shell/plugins"'
        self.path.write_text(source)
        with patch.object(
            updater, "github", return_value={"tag_name": "v2.0.0"}
        ) as github:
            updater.update_flake(self.path)
        github.assert_called_once_with("boot/loader", "releases/latest")
        self.assertEqual(self.path.read_text(), source.replace("v1.0.0", "v2.0.0"))

    def test_packages_preserve_filters_and_support_scoped_names(self):
        settings = {
            "packages": [
                "npm:@scope/tool@1.0.0",
                "npm:@scope/unpinned",
                {
                    "source": "git:github.com/owner/skills@old",
                    "extensions": [],
                    "skills": ["skill"],
                },
                "./local",
            ],
            "tuiMode": "regular",
        }
        self.path.write_text(json.dumps(settings))
        with (
            patch.object(updater, "fetch", return_value={"version": "2.0.0"}) as fetch,
            patch.object(updater, "github", return_value={"sha": "a" * 40}),
        ):
            updater.update_packages(self.path)
        self.assertEqual(
            fetch.call_args_list[1].args,
            ("https://registry.npmjs.org/@scope/unpinned/latest",),
        )
        updated = json.loads(self.path.read_text())
        self.assertEqual(
            updated["packages"][:2],
            ["npm:@scope/tool@2.0.0", "npm:@scope/unpinned@2.0.0"],
        )
        self.assertEqual(
            updated["packages"][2],
            dict(
                settings["packages"][2],
                source="git:github.com/owner/skills@" + "a" * 40,
            ),
        )
        self.assertEqual(updated["packages"][3], "./local")
        self.assertEqual(updated["tuiMode"], "regular")

    def test_invalid_release_leaves_file_unchanged(self):
        source = '"github:boot/loader/v1.0.0"'
        self.path.write_text(source)
        with (
            patch.object(
                updater, "github", return_value={"tag_name": 'v2.0.0"; malicious'}
            ),
            self.assertRaises(ValueError),
        ):
            updater.update_flake(self.path)
        self.assertEqual(self.path.read_text(), source)

    def test_failed_package_fetch_leaves_file_unchanged(self):
        source = '{"packages": ["npm:tool@1.0.0"]}'
        self.path.write_text(source)
        with (
            patch.object(updater, "fetch", side_effect=OSError("offline")),
            self.assertRaises(OSError),
        ):
            updater.update_packages(self.path)
        self.assertEqual(self.path.read_text(), source)


if __name__ == "__main__":
    unittest.main()
