## Building a Custom Hook in React

In this article, we'll walk through how to build a custom React hook called `useWindowSize`, which listens to window resize events and returns the current viewport size.

---

### 🧠 Why use a custom hook?

Creating a reusable hook simplifies your components and improves maintainability.

> Hooks let you extract component logic into reusable functions.
[picture](https://source.unsplash.com/random/800x400)

---

### ✅ Features of our hook

- Uses `useEffect` and `useState`
- Cleans up event listeners
- Fully typed with TypeScript

---

### 🧪 Example usage:

```tsx
import { useWindowSize } from '@/hooks/useWindowSize';

const Component = () => {
  const { width, height } = useWindowSize();
  return (
    <p>Width: {width}, Height: {height}</p>
  );
};
