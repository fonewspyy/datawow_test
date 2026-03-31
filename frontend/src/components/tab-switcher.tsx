interface TabSwitcherProps {
  activeTab: "overview" | "create";
  onChange: (tab: "overview" | "create") => void;
}

export function TabSwitcher({ activeTab, onChange }: TabSwitcherProps) {
  return (
    <div className="tab-switcher">
      <button
        className={`tab-button ${activeTab === "overview" ? "is-active" : ""}`}
        type="button"
        onClick={() => onChange("overview")}
      >
        Overview
      </button>
      <button
        className={`tab-button ${activeTab === "create" ? "is-active" : ""}`}
        type="button"
        onClick={() => onChange("create")}
      >
        Create
      </button>
    </div>
  );
}