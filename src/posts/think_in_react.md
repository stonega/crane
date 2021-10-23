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
现在你已经在设计图中分出了组件，并进行了分组。设计图中组件里的组件对应为架构里的子组件。

* FilterableProductTable
  * SearchBar
  * ProductTable
    * ProductCategoryRow
    * ProductRow

### 步骤二 用 React 构建静态页面

现在你已经有了组件树，是时候构建应用了。最直接的做法就是构建一个版本，仅使用数据模型渲染 UI，不添加任何互动。往往构建静态页面是较为容易的，之后再增加互动。构建静态页面需要大量的敲键盘且不需要太多思考，但是增加互动需要大量的思考，已经不那那么多代码。

要构建一个应用渲染你的数据模型，你需要先实现复用组件的组件并且通过 Props 传值。Props 是一种将数据从父组件传递到子组件的方法。如果你对状态管理很熟悉，请不要在构建静态版本时使用状态管理，状态管理通常用于互动，也就是数据会随着时间改变。对于静态页面并不需要。

你可以自上而下构建组件，从组件架构里较高层级的组件（比如 FilterableProductTable ）开始，也可以自下而上构建组件，从组件架构里较底层的组件（比如 ProductionRow ）开始。对于简单的应用，一般采用自上而下的方式，对于大型的项目，采用自下而上的方式更为容易。

```javascript
function ProductCategoryRow({ category }) {
  return (
    <tr>
      <th colSpan="2">
        {category}
      </th>
    </tr>
  );
}

function ProductRow({ product }) {
  const name = product.stocked ? product.name :
    <span style={{ color: 'red' }}>
      {product.name}
    </span>;

  return (
    <tr>
      <td>{name}</td>
      <td>{product.price}</td>
    </tr>
  );
}

function ProductTable({ products }) {
  const rows = [];
  let lastCategory = null;

  products.forEach((product) => {
    if (product.category !== lastCategory) {
      rows.push(
        <ProductCategoryRow
          category={product.category}
          key={product.category} />
      );
    }
    rows.push(
      <ProductRow
        product={product}
        key={product.name} />
    );
    lastCategory = product.category;
  });

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  );
}

function SearchBar() {
  return (
    <form>
      <input type="text" placeholder="Search..." />
      <label>
        <input type="checkbox" />
        {' '}
        Only show products in stock
      </label>
    </form>
  );
}

function FilterableProductTable({ products }) {
  return (
    <div>
      <SearchBar />
      <ProductTable products={products} />
    </div>
  );
}

const PRODUCTS = [
  {category: "Fruits", price: "$1", stocked: true, name: "Apple"},
  {category: "Fruits", price: "$1", stocked: true, name: "Dragonfruit"},
  {category: "Fruits", price: "$2", stocked: false, name: "Passionfruit"},
  {category: "Vegetables", price: "$2", stocked: true, name: "Spinach"},
  {category: "Vegetables", price: "$4", stocked: false, name: "Pumpkin"},
  {category: "Vegetables", price: "$1", stocked: true, name: "Peas"}
];

export default function App() {
  return <FilterableProductTable products={PRODUCTS} />;
}
```
不要对这段代码感到担心，在这个教程，我们更注重概念而不是代码。你可以通过[Describing the UI](https://beta.reactjs.org/learn/describing-the-ui) 更多了解这段代码。

After building your components, you’ll have a library of reusable components that render your data model. Because this is a static app, the components will only return JSX. The component at the top of the hierarchy (FilterableProductTable) will take your data model as a prop. This is called one-way data flow because the data flows down from the top-level component to the ones at the bottom of the tree.

构建组件完成后，你将拥有一个组件库来渲染你的数据。因为这是一个静态数据，组件将只返回 JSX 。顶层的组件 (FilterableProductTable) 将会接受数据模型作为 Prop 。这就是所谓的单向数据流，因为数据从顶层组件流向底层的组件。

### 步骤三 找到最小化但完整的应用状态

想要 UI 用互动性，你需要运行用户改变数据模型。你需要太多状态管理来实现。

Think of state as the minimal set of changing data that your app needs to remember. The most important principle for structuring state is to keep it DRY (Don’t Repeat Yourself). Figure out the absolute minimal representation of the state your application needs and compute everything else on-demand. For example, if you’re building a shopping list, you can store the items as an array in state. If you want to also display the number of items in the list, don’t store the number of items as another state value—instead, read the length of your array.

状态其实是你的应用需要记住的实时变化的数据的最小集合。构建状态最重要的原则就是不要重复 [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)。找出你的应用所需要状态的最小代表，剩余的则通过计算实现。例如，如果你在构建一个购物清单，你可以将商品存储在一个数组里。如果你想展示商品的数量，不要存储数据在另一个状态值里，而是使用数组的长度。

以下是应用里的所有数据：
1. 原始产品列表
2. 用户输入内容
3. 选择框数据
4. 过滤后的产品列表

这其中那些是状态值？那些不是呢？

* 数据不会改变，那一定不属于状态
* 数据来自于父组件，一定不属于状态
* 可以通过已有的状态值和数据值计算，那一定不属于状态值

剩余的基本都是状态值。

让我们一个一个来分析：

1. 原始产品数据通过 Props 传值，不属于状态值。
2. 搜索值是状态值因为它会随着时间改变并且不能计算而来。
3. 选择框的值是状态值因为会随着时间改变并且不能计算而来。
4. 过滤后的产品不属于状态值，因为它可以通过原始产品列表和搜索值以及选择框数据计算而来。

可见，只有搜索值和选择框的值属于状态值。

#### 深入
在 React 中有两种数据 Props 和 State,这两者有很大不同。
* Props 像你在函数中的传入变量。它帮助父组件将数据传值给子组件，修改子组件的样式。比如， Form 可以传递颜色值给 Button 。
* State 像组件的记忆。它帮助组件追踪一些信息并根据信息改变自己的状态。比如，Button 需要追踪 isHovered 状态值。

Props 和 State 是不同的，但是它们一起工作，父组件经常保持一些信息在状态值里，通过 Prop 将数据传递给子组件。第一次阅读时感到疑惑是正常的，这需要通过联系慢慢熟悉。

### 步骤四 判断状态所处位置

After identifying your app’s minimal state data, you need to identify which component is responsible for changing this state, or owns the state. Remember: React uses one-way data flow, passing data down the component hierarchy from parent to child component. It may not be immediately clear which component should own what state. This can be challenging if you’re new to this concept, but you can figure it out by following these steps!

在确定应用的状态值后，你需要判断哪一个组件用来负责状态修改，或者拥有状态值。记住： React 使用单向数据流，从父级组件传递数据到字组件。哪个组件应该拥有状态值可能不是立刻清晰。当你的第一次接触时会很有挑战，你可以通过以下步骤来完成。

对于你应用里的每一个状态值：

1. 找出根据状态值渲染数据的组件。
2. 找出它们最接近的共同父级组件。
3. 确定状态值的位置：

    1. 通常，你可以将状态值放在共同父组件里。
    2. 你可以将状态值放在共同父组件更上层的组件中。
    3. 如果你找不到一个组件可以放置状态，你可以单独创建一个新的组件，并把他添加为共同父组件的上层组件。
在前面的步骤中，你发现了应用中需要两个状态值：搜索框输入值和选择框输入值。在这个例子中，它们总是共同出现，因此可以认为它们是同一个状态。

现在我们来整理这些状态值：

1. 找到使用状态值的组件
    * ProructTable 需要更具状态过滤产品列表。
    * SearchBar 需要展示状态值。
2. 找到共同的父组件。最先的共同父组件是 FilterableProductTable 。
3. 决定状态值位置。状态将位于 FilterableProductTable 。

因此状态值将位于 FilterableProductTable 。

使用 [useState(hook)](https://beta.reactjs.org/reference/usestate) 来管理组件状态。钩子可以帮助你在组件的渲染过程中。在 FilterableProductTable 最上层添加两个状态变量并赋予初始值。

```javascript
function FilterableProductTable({ products }) {
  const [filterText, setFilterText] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
```
然后， 将 filterText 和 isStockOnly 传递到 ProductTable 和 SearchBar 。
```jsvascript
<div>
  <SearchBar 
    filterText={filterText} 
    inStockOnly={inStockOnly} />
  <ProductTable 
    products={products}
    filterText={filterText}
    inStockOnly={inStockOnly} />
</div>
```
你可以看到应用如何执行。通过修改 useState('') 为 useState('fruit') 修改 filerText 初始值。你可以看到搜索值和表格更新。

在上面的 sandbox 里， ProductTable 和 SearchBar 读取 filerText 和 inStockOnly props 来渲染表格，输入框和选择框。例如，这里是 SearchBar 设置初始值。
```javascript
function SearchBar({ filterText, inStockOnly }) {
  return (
    <form>
      <input 
        type="text" 
        value={filterText} 
        placeholder="Search..."/>
```
Refer to the Managing State to dive deeper into how React uses state and how you can organize your app with it.

你可以通过 [管理状态](https://beta.reactjs.org/learn/managing-state) 来了解更多个关于 React 使用状态以及你如何在应用里管理状态。

### 步骤五 添加逆向数据流

现在你的应用可以正确渲染 props 和 states 流向。但是要支持根据用户输入修改状态，你需要支持数据从另一个方向流动: 下层的表单组件需要更新 FilterableProductTable 状态。

React 保证数据流动是精确的，但是它需要更多的代码来实现双向绑定。如果你试着在输入框输入数据或者选择选择框，你会发现 React 忽略你的输入。这是有意为之的。通过 `<input value={filterText}></input>`,你已经设置输入的值永远等于 filterText 状态值，因为 filterText 的状态值从来没有被设置，输入值就不会变。

你想要根据用户修改输入值跟新状态。状态值属于 FilterableProductTable ,因此只有它可以使用 setFilterText 和 setInStockOnly 。为了让 SearchBar 更新 FilterableProductTable 的状态值，你需要传递这些函数到 SearchBar 。

```javascript
function FilterableProductTable({ products }) {
  const [filterText, setFilterText] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);

  return (
    <div>
      <SearchBar 
        filterText={filterText} 
        inStockOnly={inStockOnly}
        onFilterTextChange={setFilterText}
        onInStockOnlyChange={setInStockOnly} />
```

Inside the SearchBar, you will add the onChange event handlers and set the parent state from them:

在 SearchBar 中，你可以添加 onChange 事件处理和设置父级组件。
```javascript
<input 
  type="text" 
  value={filterText} 
  placeholder="Search..." 
  onChange={(e) => onFilterTextChange(e.target.value)} />
```

现在应用正常工作了。

你可以在 [添加互动](https://beta.reactjs.org/learn/adding-interactivity) 学习所以关于处理事件更新状态。