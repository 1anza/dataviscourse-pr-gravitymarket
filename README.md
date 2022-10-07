# dataviscourse-pr-gravitymarket


# Beeswarm chart with dynamic node aggregation

* There are thousands of companies that can make up a stock market sector. In S&P 500 data, this number would be much smaller, but still in the tens to hundreds.
* We can't render each company in the sector as an individual node in the beeswarm. This would be too messy.

## Solution
---
Let $k$ represent the number of companies in a sector.

For a given sector, we want to be able to pick a number, $r, r \in [1, k]$, and render exactly $r$ nodes in the beeswarm. Increasing the value of r during rendering would cause the number of nodes to increase, with newly added nodes appearing like they were added at the location of the node that created it. 

If $r=k$, each node is a company; the y value that the node will be attracted to in the simulation will be the percent change of that company. The radius will depend on the market cap of the company. If $r=1$, the node being displayed represents all of the companies in the sector; its y axis value is the percent change of that entire sector, the radius represents the market cap of that entire sector. When we increase $r$ from $r=1$ to $r=2$, we would expect that the largest company in the sector is the company that gets split from the rest of the sector. Similarly, when we increase r, we want the next biggest company to be split off to make a new node. The new nodes should be spawned next to the position of ther parent sector.

### Planning
---

```
Initialize an array M to store precomputed radii and price_values for each node.

For each timeseries data point:
	For each sector:
		For j in [1 ... r):
			Compute the radius of the node representing the jth biggest stock in this 
			sector. Add this node to M.

		For i in [0 ... r):
			Compute the radius of the node composed of the k-i smallest stocks.
			Add this node to M.
			# This is the node that will be rendered at zoom level r, along with the 
			# r-1 nodes representing the r-1 biggest stocks in this particular sector. 
```

Have an update method that is called whenever $r$ is changed for a sector. Access from $M$ the array of nodes to be rendered at this $r$ level. (At any $r$ level, there should be the $r-1$ biggest stocks in that sector, and then a node representing all of the other stocks in that sector.)

The initial $x,y$ positions of the new nodes should depend on the $x, y$ position of the node in the simulation that they are spawning from. Per sector, if increasing $r$, there is only ever one node that new nodes spawn from; this is the node representing the $k-r$ smallest companies in that sector. If decreasing $r$, the new big aggregated node should have it's position set to the position of the old big aggregated node.

For nodes that already exist in the simulation, you do nothing.

For nodes that have been removed from the nodes data, you remove them from the simulation.

Relevant example code: https://observablehq.com/@ben-tanen/a-tutorial-to-using-d3-force-from-someone-who-just-learned-ho

Another code example of how to spawn new nodes: https://stackoverflow.com/questions/40018270/d3js-v4-add-nodes-to-force-directed-graph
