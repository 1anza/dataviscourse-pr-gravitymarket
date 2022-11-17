"""
usage: python check_data.py <data-path.json>
"""
import pandas as pd
import sys

dat = pd.read_json(sys.argv[1])

# Checks for null values
for i in range(dat.last_valid_index()):
    for j in range(len(dat.iloc[0].chart)):
        print(i, j)
        print(dat.iloc[i].chart[j])
