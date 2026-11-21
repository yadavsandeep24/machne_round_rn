# Walmart: UI component + horizontal FlatList

Built from `01-minimal`. Source: a Walmart Global Tech React Native interview (Nov 2024, [Medium](https://medium.com/@poonkuzhali_98336/walmart-global-tech-interview-experience-cdc3509408ea), summary only): in an RN playground, build a simple UI component and a horizontal FlatList; questions on using the right components and on package dependencies. Aim for 30–45 minutes.

## What is built
- `ProductCard`: presentational, memoised, one accessibility label ("title, price, rated x out of 5"), image with placeholder, optional badge.
- `ProductCarousel`: horizontal `FlatList` with snapping, separators, page dots that follow the first visible card, empty shelf hidden.
- Home screen: a vertical `ScrollView` with two shelves.

## Points to make in the round
| Topic | Answer |
|---|---|
| FlatList vs ScrollView + map | FlatList virtualises (renders a window, recycles); `ScrollView` renders everything. A few small static items: ScrollView is fine. |
| Horizontal `getItemLayout` | `length` is the item **width + gap**; enables instant `scrollToIndex` and skips measuring. |
| Snapping | `snapToInterval={width + gap}` + `decelerationRate="fast"`; `pagingEnabled` only for full-width pages. |
| `onViewableItemsChanged` | Must keep the same identity for the list's lifetime or FlatList throws "Changing onViewableItemsChanged on the fly is not supported": `useCallback` with stable deps, config as a module constant (tested). |
| Nesting | Horizontal lists inside a vertical ScrollView are fine (different axes). A vertical FlatList inside a vertical ScrollView breaks virtualisation and warns. |
| Re-renders | Module-level `keyExtractor`/`getItemLayout`/`Separator`, memoised card, stable `onPress`. |
| Tuning | `initialNumToRender`, `windowSize`; for very long or image-heavy lists, FlashList (recycling) and `expo-image` (disk cache). |
| Dependencies | Keep the component dependency-free; adding FlashList or a carousel library is a trade-off (native code, upgrades, bundle size) worth stating. |
| Accessibility | Decorative dots hidden from screen readers; header role on the shelf title; card is one button with a full label. |

## Tests (12)
Card label, press callback, horizontal layout maths, dots follow visibility with a stable callback identity, empty shelf hidden. Plus core tests and the app shell.
