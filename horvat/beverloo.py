import matplotlib.pyplot as plt
import numpy as nup
import getopt
import sys
import os
import json
import pprint
from mpl_toolkits.mplot3d import Axes3D
import math

def main():

	with open("beverloo.json") as data_file:
		data = json.load(data_file)

	global np, B, r, d, Qob
	Qob = data["Q"]
	N = data["N"]
	L = data["L"]
	h = data["h"]
	r = data["d"]
	d = data["D"]
	g = data["g"]

	np = N / (L * h)
	#print np
	B = np * math.sqrt(g)
	#print B
	Q = []
	global cmax
	cmax = int(min(d)/r/0.01)
	for i in xrange(0,len(Qob)):
		Qi = []
		Qobi = Qob[i]
		for x in xrange(1,cmax):
			c = x * 0.01
			Qi.append(abs(Qobi - B * math.sqrt((d[i] - c*r) ** 3)))
		Q.append(Qi)

	legends = ['D = 0.15','D = 0.20','D = 0.25','D = 0.30', 'Total']
	labels = {"x": "c","y": "Error [part/s]"}
	plot(Q,legends,labels)

def plot(data,legends,labels):
	#for some_data in data:
	#	plt.plot(map(lambda e: e*0.01, xrange(1,cmax)), some_data)
	QQ = []
	for i in xrange(1,cmax):
		Q = 0.0
		for some_data in data:
			Q += some_data[i-1]
		QQ.append(Q)
	plt.plot(map(lambda e: e*0.01, xrange(1,cmax)), QQ)
	cmin = (QQ.index(min (QQ)) + 1) * 0.01
	plt.legend(["Total"])
	plt.xlabel(labels["x"])
	plt.ylabel(labels["y"])
	print (cmin)
	#plt.yscale('log')
	#_max = 1.0
	#_min = -1.0
	#_delta = (_max - _min) / 15
	#_delta = 0.01 if _delta == 0 else _delta
	#plt.yticks(np.arange(_min - _delta, _max + _delta, _delta))
	plt.savefig(os.path.join(os.getcwd(),"./i.png"))
	plt.close()

	QQQ = []
	minD = cmin*r
	rangeee = xrange(1, int((max(d)*1.1-minD)/0.01))
	for i in rangeee:
		QQQ.append(B * math.sqrt((minD + i*0.01 - (cmin) * r) ** 3))
	for i, elem in enumerate(Qob):
		plt.errorbar([d[i]],[elem],yerr=[elem*0.1],fmt='o')
	plt.legend(legends)
	plt.plot(nup.array(rangeee)*0.01+minD,QQQ)
	plt.savefig(os.path.join(os.getcwd(),"./i2.png"))


if __name__ == '__main__':
	main()