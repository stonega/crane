* 使用 `vueuse` 的 `useHover` 时，需要在元素中添加 `@click="() => void 0"`，否则在 ios 中不生效。 #flutter

* Reveve undefined type from union type. 
```typescript
type Foo = NonNullable<FooOrUndefined> // { bar: number; }
```