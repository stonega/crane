---
title: NestedScrollView 使用指南
date: "2023-01-30"
tags: [Flutter, Widget]
description: NestedScrollView 使用指南
permalink: posts/{{ title | slug }}/index.html
---

## NestedScrollView 是什么

通常当 App 页面内使用滚动组件时，为了优化用户体验，我们需要将列表的滚动区域最大化，这时候就需要 NestedScrollView 组件了，NestedScrollView 用于管理多个滚动组件，它可以让多个滚动组件嵌套滚动，这样就可以让滚动组件的滚动区域最大化。NesetedScrollView 组件最常用的场景是 SliverAppBar + TabView。

## 基本用法

使用 NestedScrollView 组件，我们需要使用 SliverOverlapAbsorber 和 SliverOverlapInjector 两个组件配合使用，SliverOverlapAbsorber 用于监听滚动事件，SliverOverlapInjector 用于将 SliverOverlapAbsorber 的滚动事件注入到子组件中。

```dart
NestedScrollView(
    headerSliverBuilder:
        (BuildContext context, bool innerBoxIsScrolled) {
      return <Widget>[
        SliverOverlapAbsorber(
          handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
          sliver: SliverAppBar(
            title: const Text('Snapping Nested SliverAppBar'),
            floating: true,
            snap: true,
            expandedHeight: 200.0,
            forceElevated: innerBoxIsScrolled,
          ),
        ),
      ];
    },
    body: Builder(builder: (BuildContext context) {
      return CustomScrollView(
        slivers: <Widget>[
          SliverOverlapInjector(
              handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context)),
        ],
    },
)
```

## 使用 TabView

```dart
NestedScrollView(
    headerSliverBuilder:
        (BuildContext context, bool innerBoxIsScrolled) {
      return <Widget>[
        SliverOverlapAbsorber(
          handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context),
          sliver: SliverAppBar(
            title: const Text('Snapping Nested SliverAppBar'),
            floating: true,
            snap: true,
            expandedHeight: 200.0,
            forceElevated: innerBoxIsScrolled,
            bottom: TabBar(
                tabs: [
                    ...
                ]
            )
          ),
        ),
      ];
    },
    body: TabBarView(
        children: [
        Builder(builder: (BuildContext context) {
      return CustomScrollView(
        slivers: <Widget>[
          SliverOverlapInjector(
              handle: NestedScrollView.sliverOverlapAbsorberHandleFor(context)),
        ],
    },],),
)
```

## 使用 RefrfeshIndicator

在 `NestedScrollView` 中使用 `RefreshIndicator` 时，需要设置 `notificationPredicate` 属性，否则会出现刷新指示器无法显示的问题。

```dart
 RefreshIndicator(
        onRefresh: () async {
            ...
        },
        notificationPredicate: (_) {
            return true;
            },
        )
```

## 自定义顶部样式

您可以修改 `FlexiableSpaceBar` 组件修改滚动时的头部效果。

```dart
if (widget.stretchModes.contains(StretchMode.fadeTitle) &&
    constraints.maxHeight > settings.maxExtent) {
final double stretchOpacity = 1 -
    clampDouble((constraints.maxHeight - settings.maxExtent) / 100,
        0.0, 1.0);
title = Opacity(
    opacity: stretchOpacity,
    child: title,
);
}
```
