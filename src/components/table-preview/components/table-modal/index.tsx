"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.scss";
import { ICellRangeData, ITableModalProps } from "./interfaces";
import { getExcelRangeMention } from "./utils";
import { useResizeWindow } from "@app/hooks";
import clsx from "clsx";
import { CellPositionType } from "./types";

//#region constants

/** px — зона у края */
const EDGE_OFFSET = 40;
/** px за тик */
const SCROLL_SPEED = 10;

//#endregion

//#region types

type ContextMenuDataType = {
  x: number;
  y: number;
  value: string;
} | null;

//#endregion

export function TableModal({
  sheet,
  rows,
  onClose,
  onMention,
}: ITableModalProps) {
  /** Ссылка на враппер таблицы */
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  /** ДЛЯ МОБИЛКИ.
   * Время последнего тапа.
   * Нужен для отслеживания дабл-тапа
   */
  const lastTap = useRef<number>(0);

  const { isMobile } = useResizeWindow();

  // данные о контекстном меню
  const [contextMenu, setContextMenu] = useState<ContextMenuDataType>(null);

  // началльная выделенная ячейка
  const [startSelection, setStartSelection] = useState<CellPositionType | null>(
    null,
  );
  // конечная выделенная ячейка
  const [endSelection, setEndSelection] = useState<CellPositionType | null>(
    null,
  );
  // выделенный диапазон. Нужен, чтобы не слетало выделение, когда отпускаем мышь/палец
  const [fixedSelection, setFixedSelection] = useState<ICellRangeData | null>(
    null,
  );
  // флаг указывающий на наличие выделенного диапазона
  const [isSelecting, setIsSelecting] = useState(false);

  /** При выделении ячеек скролит таблицу, если подходим к краям */
  const autoScroll = (clientX: number, clientY: number) => {
    const wrapper = tableWrapperRef.current;

    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();

    // вертикаль
    if (clientY < rect.top + EDGE_OFFSET) {
      wrapper.scrollTop -= SCROLL_SPEED;
    } else if (clientY > rect.bottom - EDGE_OFFSET) {
      wrapper.scrollTop += SCROLL_SPEED;
    }

    // горизонталь
    if (clientX < rect.left + EDGE_OFFSET) {
      wrapper.scrollLeft -= SCROLL_SPEED;
    } else if (clientX > rect.right - EDGE_OFFSET) {
      wrapper.scrollLeft += SCROLL_SPEED;
    }
  };

  /** Обрабатывает начало выделения */
  const handleStartSelection = (r: number, c: number) => {
    setIsSelecting(true);
    setStartSelection([r, c]);
    setEndSelection([r, c]);
    setFixedSelection(null);
  };

  /** Обрабатывает окончание выделения */
  const handleEndSelection = () => {
    if (isSelecting && startSelection && endSelection) {
      setFixedSelection({ start: startSelection, end: endSelection });
    }
    setIsSelecting(false);
  };

  /** Обрабатывает нажатие мыши на ячейку
   *
   * @param r row
   * @param c column
   */
  const handleMouseDownCell =
    (r: number, c: number) => (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();

      handleStartSelection(r, c);
    };

  /** Обрабатывает начало касания на ячейке
   *
   * @param r row
   * @param c column
   */
  const handleTouchStartCell = (r: number, c: number) => () => {
    const now = Date.now();

    if (now - lastTap.current < 300) {
      handleStartSelection(r, c);
    }

    lastTap.current = now;
  };

  /** Двигает выделение относительно X и Y */
  const handleMoveSelection = (clientX: number, clientY: number) => {
    autoScroll(clientX, clientY);

    const target = document.elementFromPoint(
      clientX,
      clientY,
    ) as HTMLElement | null;

    if (!target) return;

    const cell = target.closest("[data-cell]") as HTMLElement | null;

    if (!cell) return;

    const r = Number(cell.dataset.row);
    const c = Number(cell.dataset.col);

    setEndSelection([r, c]);
  };

  /** Обрабатывает движение пальца по таблице */
  const handleTouchMoveTable = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSelecting) return;

    e.preventDefault();

    const touch = e.touches[0];

    handleMoveSelection(touch.clientX, touch.clientY);
  };

  /** Проверяет выделена ли ячейка
   *
   * @param r row
   * @param c column
   */
  const isSelected = (r: number, c: number) => {
    const sel =
      fixedSelection ||
      (startSelection && endSelection
        ? { start: startSelection, end: endSelection }
        : null);

    if (!sel) return false;

    const rMin = Math.min(sel.start[0], sel.end[0]);
    const rMax = Math.max(sel.start[0], sel.end[0]);
    const cMin = Math.min(sel.start[1], sel.end[1]);
    const cMax = Math.max(sel.start[1], sel.end[1]);
    return r >= rMin && r <= rMax && c >= cMin && c <= cMax;
  };

  /** Обрабатывает сохранение меншона */
  const handleSaveMention = () => {
    const sel =
      fixedSelection ||
      (startSelection && endSelection
        ? { start: startSelection, end: endSelection }
        : null);

    if (!sel) return;

    const mention = getExcelRangeMention({
      rangeData: sel,
      sheet,
    });

    onMention(mention);
    onClose();
  };

  /** Обработчик открытия контекстного меню для ячейки */
  const onContextMenuCell =
    (value: string) => (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault();

      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        value,
      });
    };

  /**
   * Вставляет значение выбранной ячейки в клипбоард
   */
  const handleCopyValue = async () => {
    if (!contextMenu) return;

    await navigator.clipboard.writeText(contextMenu.value);

    setContextMenu(null);
  };

  // если открыто контекстное меню, вешаем событие на документ,
  // которое при любои клике закрывает меню
  useEffect(() => {
    if (!contextMenu) return;

    const closeContextMenu = () => setContextMenu(null);

    document.addEventListener("click", closeContextMenu);

    return () => {
      document.removeEventListener("click", closeContextMenu);
    };
  }, [contextMenu]);

  // срабатывает на любое изменение данных выделения ячеек
  // вешает событие на документ, чтобы при выделении мышкой оно продолжалось, если вышли за блок
  useEffect(() => {
    if (!isSelecting) return;

    const handleMouseMove = (e: MouseEvent) =>
      handleMoveSelection(e.clientX, e.clientY);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleEndSelection);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleEndSelection);
    };
  }, [isSelecting, startSelection, endSelection]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <b className={styles.title}>{sheet}</b>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div
          ref={tableWrapperRef}
          className={styles.tableWrapper}
          style={{
            // убираем скроллы при выделении
            overflow: isSelecting ? "hidden" : "auto",
            touchAction: isSelecting ? "none" : "pan-x pan-y",
          }}
        >
          <div
            className={styles.gridTable}
            onTouchMove={handleTouchMoveTable}
            onTouchEnd={handleEndSelection}
            style={{
              gridTemplateColumns: `repeat(${rows[0]?.length || 1}, minmax(${isMobile ? 100 : 180}px, 1fr))`,
            }}
          >
            {rows.map((row, r) =>
              row.map((cell, c) => (
                // TODO: вообще, было бы мега-классно и мега-удобно тут сделать инпут при двойном нажатии,
                // когда он появляется, мы вводим или меняем данные, нажимаем save, тем самым отправляя иишке запрос,
                // и у нас как подтверждение выскакивало бы модальное окошко
                <div
                  data-cell
                  key={`${r}-${c}`}
                  data-row={r}
                  data-col={c}
                  className={clsx(
                    styles.gridCell,
                    isSelected(r, c) && styles.selected,
                  )}
                  onMouseDown={handleMouseDownCell(r, c)}
                  onTouchStart={handleTouchStartCell(r, c)}
                  onContextMenu={onContextMenuCell(cell)}
                >
                  {cell}
                </div>
              )),
            )}
          </div>
        </div>

        <button
          className={styles.saveBtn}
          disabled={!startSelection && !fixedSelection}
          onClick={handleSaveMention}
        >
          Сохранить выделение
        </button>
        {contextMenu && (
          <div
            className={styles.contextMenu}
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
            }}
          >
            {/* TODO: можно добавить возможность копирования диапазона */}
            <button className={styles.itemBtn} onClick={handleCopyValue}>
              Скопировать значение
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
