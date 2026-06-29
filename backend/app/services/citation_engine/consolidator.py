from typing import List

def consolidate_pages(pages: List[int]) -> str:
    """
    Takes an array of potentially duplicate, unsorted pages like [12, 12, 13, 15] 
    and returns a clean formatted string like "12-13, 15".
    """
    if not pages:
        return ""
        
    unique_sorted = sorted(list(set(pages)))
    
    if len(unique_sorted) == 1:
        return str(unique_sorted[0])
        
    ranges = []
    start = unique_sorted[0]
    end = start
    
    for i in range(1, len(unique_sorted)):
        if unique_sorted[i] == end + 1:
            end = unique_sorted[i]
        else:
            if start == end:
                ranges.append(str(start))
            else:
                ranges.append(f"{start}-{end}")
            start = unique_sorted[i]
            end = start
            
    if start == end:
        ranges.append(str(start))
    else:
        ranges.append(f"{start}-{end}")
        
    return ", ".join(ranges)
