---
title: A Guide to NestedScrollView
date: "2023-01-30"
tags: [Flutter, Widget]
description: A guide to using NestedScrollView in Flutter.
permalink: posts/nested-scroll-view-guide/en/index.html
lang: en
isTranslation: true
---

## What Is NestedScrollView?

When an app page contains scrollable widgets, maximizing the usable scrolling area can improve the experience. `NestedScrollView` coordinates multiple scrollable widgets so that an outer header and inner content can scroll together. A common use case combines a `SliverAppBar` with a tab view.

## Basic Usage

To use `NestedScrollView`, pair `SliverOverlapAbsorber` with `SliverOverlapInjector`. The absorber records the overlap produced by the header, and the injector applies the corresponding space inside the inner scroll view.

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

## Using a TabView

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

## Using RefreshIndicator

When using `RefreshIndicator` inside `NestedScrollView`, set `notificationPredicate`; otherwise, the refresh indicator may fail to appear.

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

## Customizing the Header

You can modify the `FlexibleSpaceBar` implementation to change the header's appearance while scrolling.

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
