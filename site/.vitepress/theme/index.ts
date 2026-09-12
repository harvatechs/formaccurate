import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import { useData } from "vitepress";
import LandingPage from "./components/LandingPage.vue";
import "./styles/landing.css";

export default {
  extends: DefaultTheme,
  Layout: () => {
    const { frontmatter } = useData();
    if (frontmatter.value.layout === "custom-landing") {
      return h(LandingPage);
    }
    return h(DefaultTheme.Layout, null, {});
  },
} satisfies Theme;
