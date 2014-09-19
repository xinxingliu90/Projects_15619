import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;


public class PageviewReducer {

	/**
	 * @param args
	 */
	public static void main(String[] args) {
		// TODO Auto-generated method stub
		try {
			BufferedReader br = 
					new BufferedReader(new InputStreamReader(System.in, "ASCII"));
			
			String input;
			String title = null, date;
			String currentTitle = null;
			int count = 0, currentCount = 0;
			int[] dateCount = new int[32];

			
			while ((input=br.readLine()) != null) {
				try {
					String[] parts = input.split("\t");
					title = parts[0];
					date = parts[1];
					count = Integer.parseInt(parts[2]);
					
					if (currentTitle != null && currentTitle.equals(title)) {
						currentCount += count;
						dateCount[Integer.parseInt(date.substring(6))] += count;
					}
					else {
						if (currentTitle != null) {
							if (currentCount > 100000) {
								String result = "";
								result += currentCount + "\t" + currentTitle;
								for (int i = 1; i < 32; i ++) {
									result += "\t" + i + ":" + dateCount[i];
								}
								System.out.println(result);
							}
						}
						currentTitle = title;
						currentCount = count;
						dateCount = new int[32];
						dateCount[Integer.parseInt(date.substring(6))] = count;
					}
				} catch (NumberFormatException e) {
					continue;
				}
			}
			if (currentTitle != null && currentTitle.equals(title))
				if (currentTitle != null) {
					if (currentCount > 100000) {
						String result = "";
						result += currentCount + "\t" + currentTitle;
						for (int i = 1; i < 32; i ++) {
							result += "\t" + i + ":" + dateCount[i];
						}
						System.out.println(result);
					}
				}
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
