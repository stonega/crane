---
title: Think in React
date: '2021-10-22'
tags: [react, translate]
description: Think in react.
permalink: posts/{{ title | slug }}/index.html
---

> 本文翻译自 https://beta.reactjs.org/learn/thinking-in-react

React 可以改变你看待设计以及开发应用的想法。在使用 React 之前，你看到的可能是茫茫一片树林，之后你会看清楚每一棵树。React 让设计系统和 UI 状态管理变得简单。在这个教程中，我们降帮助你使用 React 完成建造一个可搜索数据表格的产品。

## 从设计图纸开始

想象你拥有一个 JSON API 接口，以及设计师的设计图纸。

JSON API 返回的数据如下：

<pre>[
  { category: "Fruits", price: "$1", stocked: true, name: "Apple" },
  { category: "Fruits", price: "$1", stocked: true, name: "Dragonfruit" },
  { category: "Fruits", price: "$2", stocked: false, name: "Passionfruit" },
  { category: "Vegetables", price: "$2", stocked: true, name: "Spinach" },
  { category: "Vegetables", price: "$4", stocked: false, name: "Pumpkin" },
  { category: "Vegetables", price: "$1", stocked: true, name: "Peas" }
]</pre>

设计图纸如下：
![Design Image](https://beta.reactjs.org/images/docs/s_thinking-in-react_ui.png)

你将通过以下五个步骤来完成这个 UI 设计。

### 步骤一 将 UI 划分成组件

首先你需要在设计图中划出组件及子组件并命名。如果你和设计师一起工作，可能设计师已经在设计工具里对这些组件进行了命名，你可以惊醒查看。

根据你的背景不同，将设计图纸划分为组件一般有以下几种方式：

* **编程** 使用你创建函数或这对象的思路，其中一种思路是 [单一任务原则](https://en.wikipedia.org/wiki/Single_responsibility_principle), 是指一个组件应该只完成一项任务。如果它一直变大，那就应该分成更小的子组件。

* **CSS** 根据你创建 CSS 选择器的思路（但是组件没有这么颗粒化）。

* **设计** 根据你设计图层的思路。

如果你的 JSON 结构好的话，你会发现它可以对应到 UI 结构的组件。这是因为 UI 和数据结构通常有相同的信息结构，也就是形状。将 UI 划分成每一个组件，每一个组件关联一个数据结构。

在这个屏幕上有五个组件。

![Components](https://beta.reactjs.org/images/docs/s_thinking-in-react_ui_outline.png)

1. FilterableProductTable (灰色) 表示整个 APP
2. Searchbar (蓝色) 接受用户输入
3. ProductTable(紫色) 展示和过滤根据用户输入获取的列表
4. ProductCategoryRow (绿色) 每一个分类头部
5. ProductRow （黄色） 展示产品列

如果你观察 ProductionTable(紫色), 你会发现表格头部(包括名字和价格标签) 并不是它自己的组件. 这是一种偏好，你可以选择任何一种方式。对于这个例子，它作为 ProductTable 一部分是因为它属于 ProductTable 的列表。然而，如果表格头部变得很复杂的话（比如新增排序）, 使用单独的 ProducTableHeader 组件就很有必要了。

Now that you’ve identified the components in the mockup, arrange them into a hierarchy. Components that appear within another component in the mockup should appear as a child in the hierarchy:





