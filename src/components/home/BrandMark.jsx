import wordmark from '../../assets/brand/pushup-wordmark.webp';

// Header identity: the brush "PUSHUP" lettering cut from the supplied 2027 artwork (design/icon-source.png),
// with the year kept as live text so archived years read correctly. The heading carries the accessible name.
export default function BrandMark({ year }) {
  return (
    <span className="brand">
      <img
        className="brand-word"
        src={wordmark}
        width="320"
        height="147"
        alt=""
        decoding="async"
        draggable="false"
      />
      {year != null && (
        <span className="brand-year">
          {year}
          <svg
            className="brand-stroke"
            viewBox="0 0 120 10"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M1 6.5C18 3.2 44 2 70 3.1c20 .8 36 1.6 49 .4-9 2.2-18 3.4-33 4.2-24 1.3-52 1.2-85 .2z" />
          </svg>
        </span>
      )}
    </span>
  );
}
