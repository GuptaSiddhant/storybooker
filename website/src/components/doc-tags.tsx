interface FrontMatter {
  tags?: string[];
}

// oxlint-disable no-undef
export function DocTags(props: FrontMatter): React.ReactNode {
  if (!props.tags || props.tags.length === 0) {
    return null;
  }

  return (
    <ul style={{ padding: 0 }}>
      {props.tags.map((tag) => (
        <li key={tag} className="badge badge--info">
          <a href={`/docs/tags/${tag}`} style={{ color: "inherit", textDecoration: "none" }}>
            {tag.toUpperCase()}
          </a>
        </li>
      ))}
    </ul>
  );
}
