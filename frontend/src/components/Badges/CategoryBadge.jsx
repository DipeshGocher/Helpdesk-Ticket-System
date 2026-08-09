import { getCategoryColors } from '../../utils/priorityColors';

export default function CategoryBadge({ category }) {
  const colors = getCategoryColors(category);
  return (
    <span className="badge" style={{ color: colors.color, background: colors.bg }}>
      {category}
    </span>
  );
}
