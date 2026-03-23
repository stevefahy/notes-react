import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import RouteLoadError from "../pages/route-load-error";

type LazyModuleLoader = () => Promise<unknown>;

/** Route-level lazy pages: failed chunk → RouteLoadError (snack + retry), not router crash. */
export function lazyRoute(
  factory: LazyModuleLoader,
): LazyExoticComponent<ComponentType<object>> {
  return lazy(() =>
    factory()
      .then((mod) => mod as { default: ComponentType<object> })
      .catch(() => ({
        default: RouteLoadError as ComponentType<object>,
      })),
  ) as LazyExoticComponent<ComponentType<object>>;
}
