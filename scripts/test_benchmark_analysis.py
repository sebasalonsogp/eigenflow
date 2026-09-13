"""Tests for the supported-boundary analysis benchmark."""

import unittest

from scripts import benchmark_analysis


class SupportedBoundaryRequestTests(unittest.TestCase):
    def test_request_uses_every_supported_node_edge_and_time_slot(self) -> None:
        request = benchmark_analysis.create_supported_boundary_request()

        self.assertEqual(len(request["nodes"]), 30)
        self.assertEqual(len(request["edges"]), 435)
        self.assertEqual(len(request["times"]), 240)
        self.assertEqual(request["heatSource"], "node-0")

    def test_percentile_uses_nearest_rank(self) -> None:
        self.assertEqual(
            benchmark_analysis.nearest_rank_percentile([4.0, 1.0, 3.0, 2.0], 0.75),
            3.0,
        )


if __name__ == "__main__":
    unittest.main()
