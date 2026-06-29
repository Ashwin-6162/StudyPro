import cv2
import numpy as np
import logging

def is_diagram(image_path: str) -> bool:
    """
    Uses OpenCV to distinguish a diagram from a normal photograph.
    Diagrams typically have many straight lines, sharp corners, and high contrast edges.
    Photos tend to have complex textures and fewer straight lines.
    """
    try:
        img = cv2.imread(image_path)
        if img is None:
            return False
            
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Edge detection
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)
        
        # Line detection using Hough Transform
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, minLineLength=30, maxLineGap=10)
        
        # Contour detection for boxes/diamonds
        contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        
        num_lines = len(lines) if lines is not None else 0
        num_contours = len(contours) if contours is not None else 0
        
        logging.info(f"Vision analysis for {image_path}: lines={num_lines}, contours={num_contours}")
        
        # Heuristic threshold: if it has enough geometric lines/contours, it's likely a diagram
        if num_lines > 5 or num_contours > 50:
            return True
            
        return False
    except Exception as e:
        logging.warning(f"Vision analysis failed for {image_path}: {e}")
        return False
