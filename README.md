# node-red-contrib-cistern

This package contains node-red nodes for usage with *cisterns*.

## Outlier
A node that removes/gets outliers of incoming values, specified by **numberOfSamples** or directly by an array.
Once the amount of input values are equal to the **numberOfSamples**:
- Outliers are removed that are outside of 1.5 times the interquartile range. [https://mathworld.wolfram.com/Outlier.html](https://mathworld.wolfram.com/Outlier.html))
- Mean value of the remaining values is given as output
- The node awaits again **numberOfSamples** or an array
