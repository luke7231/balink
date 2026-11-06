import copy
import unittest
from prepare_cloudtype import prepare
import yaml


class PrepareTest(unittest.TestCase):
    def setUp(self):
        self.config = {
            "name": "black-swan-api", "app": "dockerfile",
            "options": {"dockerfile": "Dockerfile", "ports": 3000, "env": [
                {"name": "DATABASE_URL", "value": "postgresql://example"},
                {"name": "CUSTOM_SETTING", "value": "preserved"},
                {"name": "DEPLOY_COMMIT_SHA", "value": "old"},
            ]},
            "resources": {"memory": 0.5},
            "context": {"git": {"url": "old-repo", "branch": "main"}, "path": "/apps/api"},
        }

    def test_preserves_environment_and_resources_but_pins_current_repository_commit(self):
        result = prepare(yaml.safe_dump(self.config), "api", "luke7231/balink", "a" * 40)
        self.assertEqual(result["resources"], self.config["resources"])
        self.assertEqual(result["options"]["env"][:2], self.config["options"]["env"][:2])
        self.assertEqual(result["options"]["env"][-1], {"name": "DEPLOY_COMMIT_SHA", "value": "a" * 40})
        self.assertEqual(result["context"]["git"], {"url": "git@github.com:luke7231/balink.git", "ref": "a" * 40})
        self.assertNotIn("path", result["context"])

    def test_rejects_wrong_service_database_or_dockerfile(self):
        for field, value in [("name", "ballet-ql"), ("app", "postgresql@16")]:
            config = copy.deepcopy(self.config)
            config[field] = value
            with self.assertRaises(ValueError):
                prepare(yaml.safe_dump(config), "api", "luke7231/balink", "sha")
        with self.assertRaises(ValueError):
            prepare(yaml.safe_dump(self.config), "scraper", "luke7231/balink", "sha")

    def test_requires_database_environment(self):
        self.config["options"]["env"] = []
        with self.assertRaises(ValueError):
            prepare(yaml.safe_dump(self.config), "api", "luke7231/balink", "sha")


if __name__ == "__main__":
    unittest.main()
