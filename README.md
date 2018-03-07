# Benchmark CI visualizer

Visualize the results of [benchmark ci
runner](%ZjxP02wfmuYPQ5+ye+M3yoszJ14rJbZDwATdJ9vTWqk=.sha256).

Config options, such as port and directory are available using --help.

This project expects to find files in the following format:

<userid>\<date of run>\system-info.json
<userid>\<date of run>\bench-01.json

bench-01.json should be a file containing a json dict with the key the
name of the benchmark and the value an array of [x, y] values.

See the
[bench-ssb-share](%r/fZCmbP0wbCqwPvONg1np7WD1UvvQh5yt3P0CoIDPw=.sha256)
repo for examples.

This requires [sbot-about](https://github.com/ssbc/ssb-about) to be
installed as a plugin in scuttlebot.
