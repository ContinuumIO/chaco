"""
Unit tests for utility functions in chaco.base
"""

import unittest
from chaco import ticks

import numpy as np
#from chaco.api import bin_search, find_runs, reverse_map_1d, point_line_distance

class TickTest(unittest.TestCase):
    def test_calc_bound(self):
        self.assertEquals(ticks.calc_bound(3.0, 2, True), 4)
        self.assertEquals(ticks.calc_bound(3.0, 2, False), 2)
        self.assertEquals(ticks.calc_bound(4.0, 2, True), 4)
        self.assertEquals(ticks.calc_bound(4.0, 2, False), 4)

    def test_tick_intervals(self):
        self.assertEquals(ticks.tick_intervals(0.0, 100.0, 13), 10)

        self.assertEquals(ticks.tick_intervals(0.0, 120.0, 3), 50)
        self.assertEquals(ticks.tick_intervals(0.0, 100.0, 5), 25)

    def test_auto_interval(self):

        self.assertEquals(ticks.auto_interval(0.0, 100.0), 20)
        self.assertEquals(ticks.auto_interval(0.0, 130.0), 25)
        self.assertEquals(ticks.auto_interval(30.0, 50.0), 2.5)

    def test_auto_interval2(self):

        self.assertEquals(ticks.auto_interval2(0.0, 100.0), 20)
        self.assertEquals(ticks.auto_interval2(0.0, 130.0), 25)
        self.assertEquals(ticks.auto_interval2(30.0, 50.0), 2.5)

    def test_auto_ticks(self):

        at = ticks.auto_ticks( 0.0, 100.0, 'fit', 'fit', 'auto')
        at_ = ticks.auto_ticks(3, 5, 3, 5, 'auto')

        self.assertEquals(
            ticks.auto_ticks(3, 5, 3, 5, 'auto'),
            [3.0, 3.25, 3.5, 3.75, 4.0, 4.25, 4.5, 4.75, 5.0])

    def test_argsort(self):

        self.assertTrue(
            (np.argsort([-3, -2, -1]) ==  [0, 1, 2]).all())
        self.assertTrue(
            (np.argsort([3,  -2, -1]) ==   [1, 2, 0]).all())

        print np.argsort([3,  -2, -1]).tolist()
        self.assertEquals(ticks.my_argsort([-3, -2, -1]),  [0, 1, 2])
        self.assertEquals(ticks.my_argsort([3,  -2, -1]),  [1, 2, 0])



if __name__ == '__main__':
    unittest.main()
