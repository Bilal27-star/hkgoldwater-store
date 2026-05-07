import * as Slider from "@radix-ui/react-slider";
import { useI18n } from "../i18n/I18nProvider";

function formatDA(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Human-readable value for assistive tech (aria-valuetext). */
function formatDAAnnounce(value: number): string {
  return `${formatDA(value)} DA`;
}

const KEYBOARD_HINT_ID = "price-range-slider-keyboard-hint";

export type PriceRangeSliderProps = {
  value: [number, number];
  onValueChange: (next: [number, number]) => void;
  /** Optional id of the visible section label (e.g. &quot;Price Range&quot; heading) for `aria-labelledby`. */
  ariaLabelledBy?: string;
  min?: number;
  max?: number;
  step?: number;
};

const thumbClass =
  "block h-5 w-5 cursor-pointer rounded-full border-2 border-blue-600 bg-white shadow-md outline-none transition-transform duration-150 hover:scale-110 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

export default function PriceRangeSlider({
  value,
  onValueChange,
  ariaLabelledBy,
  min = 0,
  max = 50000,
  step = 500
}: PriceRangeSliderProps) {
  const { t } = useI18n();
  const [minVal, maxVal] = value;

  const groupProps =
    ariaLabelledBy != null && ariaLabelledBy !== ""
      ? { "aria-labelledby": ariaLabelledBy }
      : { "aria-label": t("filters.priceRangeLabel") };

  return (
    <div role="group" {...groupProps} className="space-y-3">
      <p
        className="text-sm tabular-nums text-gray-900 transition-[opacity] duration-200"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="font-medium">{formatDA(minVal)} DA</span>
        <span className="mx-1.5 text-gray-400" aria-hidden>
          —
        </span>
        <span className="font-medium">{formatDA(maxVal)} DA</span>
      </p>

      <p id={KEYBOARD_HINT_ID} className="sr-only">
        {t("filters.sliderHint")}
      </p>

      <Slider.Root
        className="relative flex h-8 w-full touch-none select-none items-center"
        value={[minVal, maxVal]}
        onValueChange={(v) => {
          if (v.length >= 2) {
            onValueChange([v[0], v[v.length - 1]]);
          }
        }}
        min={min}
        max={max}
        step={step}
        minStepsBetweenThumbs={1}
        orientation="horizontal"
      >
        <Slider.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-gray-200">
          <Slider.Range className="absolute h-full rounded-full bg-blue-600" />
        </Slider.Track>
        <Slider.Thumb
          className={thumbClass}
          aria-label={t("filters.minPrice")}
          aria-valuetext={formatDAAnnounce(minVal)}
          aria-describedby={KEYBOARD_HINT_ID}
        />
        <Slider.Thumb
          className={thumbClass}
          aria-label={t("filters.maxPrice")}
          aria-valuetext={formatDAAnnounce(maxVal)}
          aria-describedby={KEYBOARD_HINT_ID}
        />
      </Slider.Root>
    </div>
  );
}
