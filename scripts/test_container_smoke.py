"""Regression tests for the production-container smoke probe."""

import unittest
from unittest.mock import patch

from scripts import container_smoke


class ContainerStartupTests(unittest.TestCase):
    @patch("scripts.container_smoke.time.sleep")
    @patch("scripts.container_smoke._request")
    def test_health_probe_retries_after_connection_reset(
        self,
        request_mock,
        sleep_mock,
    ) -> None:
        request_mock.side_effect = [
            ConnectionResetError("container is still starting"),
            (
                200,
                b'{"status": "ok", "service": "eigenflow-api"}',
            ),
        ]

        health = container_smoke._wait_until_ready()

        self.assertEqual(health, {"status": "ok", "service": "eigenflow-api"})
        sleep_mock.assert_called_once_with(1)


if __name__ == "__main__":
    unittest.main()
